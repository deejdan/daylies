import type { Command } from "./types.js";
import { loadConfig } from "../shared/config.js";
import {
  getAgent,
  getDailyFilePath,
  getDailyFilenameFromDateInput,
  getNotesDirectory,
  readNoteFile,
  runAgentPrompt,
  withSpinner,
} from "../shared/shared.js";

const SUMMARY_PROMPT = `You are summarizing a daily note. The note may contain raw, unstructured thoughts.

Summarize the following daily note into a concise digest. Focus on:
- What was accomplished or worked on
- Key learnings or insights
- Decisions made
- Anything that seems important or recurring

Write in past tense, third person is fine.
Do not invent or infer content that isn't there.
If the note is sparse, just summarize what's there without padding.`;

type SummarizeOptions = {
  date?: string;
};

function parseSummarizeArgs(args: string[]): SummarizeOptions {
  let date: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--date") {
      const value = args[index + 1];

      if (!value) {
        throw new Error(
          "Usage: daylies summarize [--date yesterday|YYYY-MM-DD|YYYY-MM-DD.md]",
        );
      }

      date = value;
      index += 1;
      continue;
    }

    throw new Error(
      `Unknown argument for summarize: ${arg}\n\nUsage: daylies summarize [--date yesterday|YYYY-MM-DD|YYYY-MM-DD.md]`,
    );
  }

  const options: SummarizeOptions = {};

  if (date) {
    options.date = date;
  }

  return options;
}

function buildSummaryPrompt(filename: string, noteContent: string): string {
  return [
    SUMMARY_PROMPT,
    "",
    `Daily note filename: ${filename}`,
    "",
    "Daily note content:",
    noteContent,
  ].join("\n");
}

export const summarizeCommand: Command = {
  name: "summarize",
  description: "Summarize today's note or a note selected by date",
  usage: "daylies summarize [--date yesterday|YYYY-MM-DD|YYYY-MM-DD.md]",
  async run(args: string[]): Promise<void> {
    const options = parseSummarizeArgs(args);
    const config = await loadConfig();
    const agent = getAgent(config);
    const notesDirectory = getNotesDirectory(false, config);
    const filename = getDailyFilenameFromDateInput(options.date);
    const filePath = getDailyFilePath(notesDirectory, filename);
    const noteContent = await readNoteFile(filePath);
    const finalPrompt = buildSummaryPrompt(filename, noteContent);
    const summary = await withSpinner("Summarizing...", () =>
      runAgentPrompt(agent, finalPrompt),
    );

    console.log(summary);
  },
};
