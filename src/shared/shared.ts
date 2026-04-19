import { spawn } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type { AppConfig } from "./config.js";

/** Builds the local-date filename for today's daily note. */
export function getTodayFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}.md`;
}

/** Resolves the editor command from the environment, config, or default fallback. */
export function getEditor(config: AppConfig): string {
  return process.env.EDITOR || config.editor || "vim";
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
  await writeFile(filePath, "", "utf8");
}
