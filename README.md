# daylies

`daylies` is a small TypeScript CLI for daily note-taking.

Right now it supports:

- opening or creating today's Markdown note
- appending notes or tasks to today's Markdown note
- summarizing today's note or a note selected by date
- using a project-root `config.json`
- overriding the notes directory with `--here`

Planned commands already scaffolded:

- `organize`

## Requirements

- Node.js
- npm

## Install And Run

First build and link the CLI:

```sh
npm run build
npm link
```

Then run it from your terminal:

```sh
daylies
```

Useful variants:

```sh
daylies
daylies open
daylies today
daylies add "captured thought"
daylies --here
daylies add --here "captured thought"
daylies add --task "follow up on this"
daylies open --here
daylies summarize
daylies summarize --date yesterday
daylies summarize --date 2026-04-20
daylies help
```

## What `--here` Does

`--here` tells `daylies` to use the current working directory instead of the configured notes directory.

Example:

```sh
cd ~/Desktop/test-notes
daylies --here
```

That will create or open today's note inside `~/Desktop/test-notes`.

## Config

The CLI reads configuration from the root `config.json`.

Current supported fields:

```json
{
  "notesDirectory": "./notes",
  "editor": "vim",
  "agent": "claude"
}
```

Behavior:

- `notesDirectory` is resolved relative to `config.json`
- `editor` is used when `$EDITOR` is not set
- `agent` selects the summarize CLI (`codex` or `claude`)
- `$EDITOR` takes precedence over `config.json`
- `--here` takes precedence over `notesDirectory`
- summarize always uses the built-in prompt in code

Current resolution order:

- notes path: `--here` -> `config.json` -> default fallback
- editor: `$EDITOR` -> `config.json` -> `vim`
- summarize agent: `config.json` -> `codex`

## Available Commands

`open`

- Opens or creates today's note

`today`

- Alias for `open`

`add`

- Appends a bullet line to today's note
- `--task` writes `- [ ] ...` instead of `- ...`

`summarize`

- Summarizes today's note or a note selected by `--date`
- Supports `--date yesterday`, `--date YYYY-MM-DD`, and `--date YYYY-MM-DD.md`

`organize`

- Placeholder for note organization

## Development

Typecheck:

```sh
npm run check
```

Build:

```sh
npm run build
```

If you change TypeScript source, rebuild before running `daylies` again because the shell command points to `dist/index.js`.

## Project Docs

- See `ARCHITECTURE.md` for the current control flow and folder layout.
