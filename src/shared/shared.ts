import { spawn } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type { AgentName, AppConfig } from "./config.js";

const NEW_DAILY_FILE_TEMPLATE = `---
# Raw Notes

`;

/** Builds the local-date filename for today's daily note. */
export function getTodayFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}.md`;
}

/** Normalizes a daily note date input into a `YYYY-MM-DD.md` filename. */
export function getDailyFilenameFromDateInput(dateInput?: string): string {
  if (!dateInput) {
    return getTodayFilename();
  }

  const normalizedDate = dateInput.endsWith(".md") ? dateInput.slice(0, -3) : dateInput;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    throw new Error(`Invalid --date value: ${dateInput}. Expected YYYY-MM-DD or YYYY-MM-DD.md`);
  }

  const parsedDate = new Date(`${normalizedDate}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid --date value: ${dateInput}. Expected a real calendar date`);
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  if (`${year}-${month}-${day}` !== normalizedDate) {
    throw new Error(`Invalid --date value: ${dateInput}. Expected a real calendar date`);
  }

  return `${normalizedDate}.md`;
}

/** Resolves the editor command from the environment, config, or default fallback. */
export function getEditor(config: AppConfig): string {
  return process.env.EDITOR || config.editor || "vim";
}

/** Resolves the configured coding agent, falling back to codex. */
export function getAgent(config: AppConfig): AgentName {
  return config.agent || "codex";
}

/** Launches the editor as an interactive child process attached to the current terminal. */
export function openEditor(editor: string, filePath: string): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn(editor, [filePath], {
      stdio: "inherit"
    });

    child.on("error", (error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        reject(new Error(`Editor not found: ${editor}`));
        return;
      }

      reject(error);
    });

    child.on("close", resolve);
  });
}

/** Resolves the base directory where daily notes are stored. */
export function getNotesDirectory(useCurrentDirectory: boolean, config: AppConfig): string {
  if (useCurrentDirectory) {
    return process.cwd();
  }

  return config.notesDirectory || path.join(homedir(), ".daylies", "notes");
}

/** Combines the base notes directory and filename into a full file path. */
export function getDailyFilePath(baseDir: string, filename: string): string {
  return path.join(baseDir, filename);
}

/** Checks whether the target daily note already exists on disk. */
export async function dailyFileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Creates the daily note file and its parent directory when missing. */
export async function createDailyFile(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, NEW_DAILY_FILE_TEMPLATE, "utf8");
}

/** Reads a note file and fails clearly when it does not exist. */
export async function readNoteFile(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Note not found: ${filePath}`);
    }

    throw error;
  }
}

/** Runs the configured coding agent non-interactively and returns its stdout text. */
export function runAgentPrompt(agent: AgentName, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const [command, ...args] =
      agent === "claude" ? ["claude", "-p", "--output-format", "text"] : ["codex", "exec", "-"];
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        reject(new Error(`Agent CLI not found: ${command}`));
        return;
      }

      reject(error);
    });

    child.on("close", (exitCode) => {
      if (exitCode !== 0) {
        const errorOutput = stderr.trim();
        const suffix = errorOutput ? `: ${errorOutput}` : "";

        reject(new Error(`Agent command failed with code ${exitCode}${suffix}`));
        return;
      }

      const result = stdout.trim();

      if (!result) {
        reject(new Error(`Agent returned empty output: ${command}`));
        return;
      }

      resolve(result);
    });

    child.stdin.end(prompt);
  });
}
