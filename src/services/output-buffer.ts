export function chunkTelegramMessage(text: string, maxLength: number): string[] {
  if (maxLength <= 0) return [text];
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
      const newPart = content.slice(last.length).replace(/^\n+/, "");
      last = content;
      return newPart ? [newPart] : [];
    },
  };
}
