import { Bot } from "grammy";
import { loadConfig } from "./config.js";
import { registerHandlers, buildMiddleware, stopRateLimitCleanup, errMessage, BOT_COMMANDS } from "./bot/handlers.js";
import { TmuxBridge } from "./services/tmux.js";
import { CurrentSessionManager } from "./services/currentSession.js";
import { fetch, ProxyAgent } from "undici";

const config = loadConfig();
const bridge = new TmuxBridge({ target: config.tmuxTarget });
const currentSessionManager = new CurrentSessionManager(process.cwd());

const bot = new Bot(config.botToken, {
  client: {
    fetch: config.proxyUrl
      ? (async (url: URL | RequestInfo, init?: RequestInit) => {
          const { signal: _signal, ...rest } = init || {};
          const dispatcher = new ProxyAgent(config.proxyUrl!);
          const requestUrl = typeof url === "string" || url instanceof URL ? url : url.url;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return fetch(requestUrl, { ...rest, dispatcher } as any);
        })
      : undefined,
  },
});

// Apply user allowlist + rate limit middleware
bot.use(buildMiddleware(config));

// Graceful error handler — don't crash on network failures
bot.catch((err) => {
  console.error("[bot] Unhandled error:", errMessage(err));
});

registerHandlers(bot, { bridge, config, currentSessionManager });

// Register bot commands once — Telegram persists them across restarts
try {
  await bot.api.setMyCommands(BOT_COMMANDS, { scope: { type: "all_private_chats" } });
  console.log(`[bot] Registered ${BOT_COMMANDS.length} commands to Telegram`);
} catch (err) {
  console.error("[bot] setMyCommands failed:", errMessage(err));
}

// Guard against duplicate signals calling stop() twice
let stopping = false;
const stop = async (signal: string) => {
  if (stopping) return;
  stopping = true;
  console.log(`Stopping bot after ${signal}`);
  stopRateLimitCleanup();
  try {
    await bot.stop();
  } catch {
    // bot may already be stopped — ignore
  }
  process.exit(0);
};

process.once("SIGINT", () => void stop("SIGINT"));
process.once("SIGTERM", () => void stop("SIGTERM"));

// Catch-all: uncaught exceptions are fatal; log and terminate
process.on("uncaughtException", (err) => {
  console.error(`[fatal] uncaughtException: ${errMessage(err)}`);
  void stop("uncaughtException").finally(() => {
    process.exit(1);
  });
});

process.on("unhandledRejection", (reason) => {
  console.error(`[fatal] unhandledRejection: ${errMessage(reason)}`);
  void stop("unhandledRejection");
});

console.log("[bot] Starting...");
await bot.start();
