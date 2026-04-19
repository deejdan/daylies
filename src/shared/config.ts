import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type AppConfig = {
  notesDirectory?: string;
  editor?: string;
};

/** Returns the path to the user config file for daylies. */
export function getConfigPath(): string {
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDirectory = path.dirname(currentFilePath);

  return path.resolve(currentDirectory, "..", "..", "config.json");
}

/** Loads and validates the user config file when it exists. */
export async function loadConfig(): Promise<AppConfig> {
  const configPath = getConfigPath();

  try {
    const rawConfig = await readFile(configPath, "utf8");
    const parsedConfig: unknown = JSON.parse(rawConfig);

    return validateConfig(parsedConfig, configPath);
  } catch (error) {
    const errnoError = error as NodeJS.ErrnoException;

    if (errnoError.code === "ENOENT") {
      return {};
    }

    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file: ${configPath}`);
    }

    throw error;
  }
}

function validateConfig(value: unknown, configPath: string): AppConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Config file must contain a JSON object: ${configPath}`);
  }

  const config = value as Record<string, unknown>;

  if ("notesDirectory" in config && typeof config.notesDirectory !== "string") {
    throw new Error(`Config field "notesDirectory" must be a string: ${configPath}`);
  }

  if ("editor" in config && typeof config.editor !== "string") {
    throw new Error(`Config field "editor" must be a string: ${configPath}`);
  }

  const validatedConfig: AppConfig = {};

  if (typeof config.notesDirectory === "string") {
    validatedConfig.notesDirectory = path.resolve(path.dirname(configPath), config.notesDirectory);
  }

  if (typeof config.editor === "string") {
    validatedConfig.editor = config.editor;
  }

  return validatedConfig;
}
