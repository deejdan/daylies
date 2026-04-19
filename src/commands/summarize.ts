import type { Command } from "./types.js";

export const summarizeCommand: Command = {
  name: "summarize",
  description: "Summarize a specific note",
  usage: "daylies summarize <file>",
  async run(): Promise<void> {
    throw new Error("summarize is not implemented yet");
  }
};
