#!/usr/bin/env node

import { organizeCommand } from "./commands/organize.js";
import { openCommand } from "./commands/open.js";
import { CommandRegistry } from "./commands/registry.js";
import { summarizeCommand } from "./commands/summarize.js";

async function main(): Promise<void> {
  const registry = new CommandRegistry("open");

  registry
    .register(openCommand)
    .register(summarizeCommand)
    .register(organizeCommand);

  await registry.dispatch(process.argv.slice(2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
  process.exitCode = 1;
});
