import * as fs from "node:fs";
import * as path from "node:path";

const CURRENT_SESSION_FILE = ".current_tmux_session";

export class CurrentSessionManager {
  private cache: string | null = null;
  private readonly filePath: string;

  constructor(dir: string) {
    this.filePath = path.join(dir, CURRENT_SESSION_FILE);
  }

  async get(): Promise<string | null> {
    if (this.cache !== null) return this.cache;
    try {
      this.cache = (await fs.promises.readFile(this.filePath, "utf-8")).trim() || null;
    } catch {
      this.cache = null;
    }
    return this.cache;
  }

  async set(sessionName: string): Promise<void> {
    await fs.promises.writeFile(this.filePath, sessionName, "utf-8");
    this.cache = sessionName;
  }

  async clear(): Promise<void> {
    try {
      await fs.promises.unlink(this.filePath);
    } catch {
      // ignore if already gone
    }
    this.cache = null;
  }
}