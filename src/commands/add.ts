import { appendFile, readFile } from "node:fs/promises";
import type { Command } from "./types.js";
import { loadConfig } from "../shared/config.js";
import {
  createDailyFile,
  dailyFileExists,
  getDailyFilePath,
  getNotesDirectory,
  getTodayFilename,
} from "../shared/shared.js";

type AddOptions = {
  addAsTask: boolean;
  text: string;
  useCurrentDirectory: boolean;
};

function parseAddArgs(args: string[]): AddOptions {
  let addAsTask = false;
  let useCurrentDirectory = false;
  const textParts: string[] = [];

  for (const arg of args) {
    if (arg === "--task") {
      addAsTask = true;
      continue;
    }

    if (arg === "--here") {
      useCurrentDirectory = true;
      continue;
    }

    textParts.push(arg);
  }

  const text = textParts.join(" ").trim();

  if (!text) {
    throw new Error('Usage: daylies add [--here] [--task] "text to append"');
  }

  return { addAsTask, text, useCurrentDirectory };
}

async function appendLine(filePath: string, text: string, addAsTask: boolean): Promise<void> {
  const existingContent = await readFile(filePath, "utf8");
  const prefix = existingContent.length > 0 && !existingContent.endsWith("\n") ? "\n" : "";
  const linePrefix = addAsTask ? "- [ ] " : "- ";

  await appendFile(filePath, `${prefix}${linePrefix}${text}\n`, "utf8");
}

export const addCommand: Command = {
  name: "add",
  description: "Append a bullet line or task to today's note",
  usage: 'daylies add [--here] [--task] "text"',
  async run(args: string[]): Promise<void> {
    const options = parseAddArgs(args);
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

    await appendLine(filePath, options.text, options.addAsTask);
  },
};
