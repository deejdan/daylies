import type { Command } from "./types.js";
import { loadConfig } from "../shared/config.js";
import {
  createDailyFile,
  dailyFileExists,
  getEditor,
  getDailyFilePath,
  getNotesDirectory,
  getTodayFilename,
  openEditor,
} from "../shared/shared.js";

type OpenOptions = {
  useCurrentDirectory: boolean;
};

function parseOpenArgs(args: string[]): OpenOptions {
  let useCurrentDirectory = false;

  for (const arg of args) {
    if (arg === "--here") {
      useCurrentDirectory = true;
      continue;
    }

    throw new Error(
      `Unknown argument for open: ${arg}\n\nUsage: daylies [open] [--here]`,
    );
  }

  return { useCurrentDirectory };
}

export const openCommand: Command = {
  name: "open",
  aliases: ["today"],
  description: "Open or create today's note",
  usage: "daylies [open] [--here]",
  async run(args: string[]): Promise<void> {
    const options = parseOpenArgs(args);
    const config = await loadConfig();
    const notesDirectory = getNotesDirectory(
      options.useCurrentDirectory,
      config,
    );
    const filename = getTodayFilename();
    const filePath = getDailyFilePath(notesDirectory, filename);

    if (!(await dailyFileExists(filePath))) {
      await createDailyFile(filePath);
    }

    const editor = getEditor(config);
    const exitCode = await openEditor(editor, filePath);

    if (exitCode !== 0 && exitCode !== null) {
      throw new Error(`Editor exited with code ${exitCode}`);
    }
  },
};
