import type { Command } from "./types.js";
import { loadConfig } from "../shared/config.js";
import {
  createDailyFile,
  dailyFileExists,
  getEditor,
  getDailyFilePath,
  getDailyFilenameFromDateInput,
  getNotesDirectory,
  openEditor,
} from "../shared/shared.js";

type OpenOptions = {
  date?: string;
  useCurrentDirectory: boolean;
};

function parseOpenArgs(args: string[]): OpenOptions {
  let date: string | undefined;
  let useCurrentDirectory = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--here") {
      useCurrentDirectory = true;
      continue;
    }

    if (arg === "--date") {
      const value = args[index + 1];

      if (!value) {
        throw new Error(
          "Usage: daylies [open] [--here] [--date yesterday|YYYY-MM-DD|YYYY-MM-DD.md]",
        );
      }

      date = value;
      index += 1;
      continue;
    }

    throw new Error(
      `Unknown argument for open: ${arg}\n\nUsage: daylies [open] [--here] [--date yesterday|YYYY-MM-DD|YYYY-MM-DD.md]`,
    );
  }

  const options: OpenOptions = { useCurrentDirectory };

  if (date) {
    options.date = date;
  }

  return options;
}

export const openCommand: Command = {
  name: "open",
  aliases: ["today"],
  description: "Open or create today's note or a note selected by date",
  usage: "daylies [open] [--here] [--date yesterday|YYYY-MM-DD|YYYY-MM-DD.md]",
  async run(args: string[]): Promise<void> {
    const options = parseOpenArgs(args);
    const config = await loadConfig();
    const notesDirectory = getNotesDirectory(
      options.useCurrentDirectory,
      config,
    );
    const filename = getDailyFilenameFromDateInput(options.date);
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
