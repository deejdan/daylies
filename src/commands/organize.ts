import type { Command } from "./types.js";

export const organizeCommand: Command = {
  name: "organize",
  description: "Write back an organized version of a day",
  usage: "daylies organize <file>",
  async run(): Promise<void> {
    throw new Error("organize is not implemented yet");
  }
};
