export function chunkTelegramMessage(text: string, maxLength: number): string[] {
  if (maxLength <= 0) {
    throw new RangeError("maxLength must be greater than 0");
  }
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

export function createOutputAccumulator() {
  let last = "";
  return {
    next(content: string): string[] {
      if (content === last) return [];
      // The newly appended portion may start with newline separators between updates;
      // trim only leading newlines to avoid emitting empty/blank chunks.
      const newPart = content.slice(last.length).replace(/^\n+/, "");
      last = content;
      return newPart ? [newPart] : [];
    },
  };
}
