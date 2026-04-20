# Architecture

This document describes the current structure of `daylies`.

The codebase is intentionally small right now. The goal is to keep the control flow obvious while leaving enough structure for new commands to be added without rewriting the app shape.

## High-Level Flow

The current runtime path for `daylies` is:

1. The shell resolves the `daylies` command through `npm link`.
2. Node runs `dist/index.js`.
3. `src/index.ts` creates a `CommandRegistry`.
4. The registry registers command objects.
5. The registry dispatches `process.argv.slice(2)`.
6. The matched command parses its own arguments.
7. The command uses shared helpers and config to do its work.

For the working `open` command, the flow is:

1. Parse command-local args such as `--here`
2. Load `config.json`
3. Resolve the notes directory
4. Build today's filename
5. Build the full note path
6. Create the note if it does not exist
7. Resolve the editor
8. Spawn the editor process

For the working `add` command, the flow is:

1. Parse command-local args such as `--here` and `--task`
2. Load `config.json`
3. Resolve the notes directory
4. Build today's filename
5. Build the full note path
6. Create the note if it does not exist
7. Append either a `- ...` bullet line or `- [ ] ...` task line to the end of the note

For the working `summarize` command, the flow is:

1. Parse command-local args such as `--date`
2. Load `config.json`
3. Resolve the target note filename
4. Resolve the full note path
5. Read the note content
6. Resolve the agent and use the built-in summarize prompt
7. Run the agent CLI non-interactively
8. Print the returned summary

## Current Folder Layout

```text
daylies/
  src/
    commands/
      add.ts
      open.ts
      organize.ts
      registry.ts
      summarize.ts
      types.ts
    shared/
      config.ts
      shared.ts
    index.ts
  config.json
  package.json
  tsconfig.json
```

## Responsibilities

### `src/index.ts`

Top-level entrypoint only.

Responsibilities:
- create the registry
- register commands
- dispatch argv
- handle top-level errors

It should stay small.

### `src/commands/registry.ts`

Owns command registration and dispatch.

Responsibilities:
- store commands and aliases
- resolve blank input to the default command
- handle `help` and `--help`
- reject unknown commands

It should not contain business logic for specific commands.

### `src/commands/*.ts`

Each command owns its own behavior.

Current rule:
- each command parses its own args
- each command calls shared helpers as needed

This keeps command behavior local and reduces cross-command coupling.

### `src/shared/shared.ts`

Holds reusable helpers that are not specific to one command.

Current contents:
- date filename generation
- editor resolution and spawning
- agent resolution and invocation
- notes directory and note path helpers
- note reading helpers
- file existence and creation helpers

This is intentionally one file for now. It can be split later when the seams become obvious.

### `src/shared/config.ts`

Owns config loading and validation.

Current behavior:
- reads root `config.json`
- validates supported fields
- resolves `notesDirectory` relative to that file
- supports `agent`

## Command Model

Commands follow a simple object contract:

```ts
type Command = {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  run: (args: string[]) => Promise<void>;
};
```

Why this shape:
- small enough to read quickly
- easy to register
- easy to extend later
- avoids heavy class-based command implementations

## Adding A Command

Current workflow:

1. Create a file in `src/commands/`
2. Export a `Command` object
3. Implement `run(args)`
4. Register it in `src/index.ts`

If the command needs flags, parse them inside that command file first.

Do not move parsing into `shared` unless multiple commands actually reuse it.

## Config Resolution

Current notes-directory precedence:

1. `--here`
2. `config.json` `notesDirectory`
3. fallback default in shared helpers

Current editor precedence:

1. `$EDITOR`
2. `config.json` `editor`
3. `vim`

Current summarize-agent precedence:

1. `config.json` `agent`
2. `codex`

Current summarize prompt:

1. built-in summarize prompt

## Design Choices

### Thin registry

The registry is intentionally small.

It should answer:
- what command was requested?
- what should run?
- how should help be shown?

It should not answer:
- how note files work
- how config works
- how an editor is launched

### Command-local parsing

Argument parsing is currently local to each command.

Reason:
- command flags are easier to understand near the command logic
- future commands can evolve independently
- avoids one central parser growing into a maintenance problem

### Flat shared helpers

Shared helpers currently live in one file.

Reason:
- the helper count is still small
- splitting too early would add more structure than value

When to split later:
- a helper group grows large
- a helper file becomes hard to scan
- a domain becomes independently meaningful, such as config, note paths, or editor launching

## Near-Term Evolution

Likely next steps:

1. make a deliberate decision about project-root config vs user-level config
2. implement `organize`
3. add tests for command dispatch, config loading, note creation, note appending, and summarize note selection
4. decide whether summarize should support positional file paths later
5. refine help output and per-command usage as needed
