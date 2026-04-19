import type { Command } from "./types.js";

/**
 * Stores registered commands and dispatches argv to the matched command handler.
 *
 * To add a command:
 * 1. Create a command module that exports a `Command` object.
 * 2. Implement its `run(args)` handler.
 * 3. Register it in `src/index.ts` with `registry.register(...)`.
 */
export class CommandRegistry {
  private commands = new Map<string, Command>();

  constructor(private readonly defaultCommandName: string) {}

  /** Registers a command and its aliases, returning the registry for chaining. */
  register(command: Command): this {
    this.registerName(command.name, command);

    for (const alias of command.aliases ?? []) {
      this.registerName(alias, command);
    }

    return this;
  }

  /** Resolves argv to a command, handles help, and invokes the matched command handler. */
  async dispatch(argv: string[]): Promise<void> {
    const [firstArg, ...rest] = argv;

    if (firstArg === "help" || firstArg === "--help") {
      this.help();
      return;
    }

    if (!firstArg || firstArg.startsWith("-")) {
      const command = this.getDefaultCommand();
      await command.run(argv);
      return;
    }

    const command = this.commands.get(firstArg);

    if (!command) {
      throw new Error(`Unknown command: ${firstArg}\n\n${this.helpText()}`);
    }

    await command.run(rest);
  }

  /** Prints the formatted help output for the registered commands. */
  private help(): void {
    console.log(this.helpText());
  }

  /** Builds the help text shown for `help`, `--help`, and unknown commands. */
  private helpText(): string {
    const uniqueCommands = new Map<string, Command>();

    for (const command of this.commands.values()) {
      uniqueCommands.set(command.name, command);
    }

    const commandLines = [...uniqueCommands.values()]
      .map((command) => {
        const aliases = command.aliases?.length
          ? ` (aliases: ${command.aliases.join(", ")})`
          : "";
        return `  ${command.usage} - ${command.description}${aliases}`;
      })
      .join("\n");

    return [
      "Usage: daylies [command] [options]",
      "",
      "Commands:",
      commandLines,
    ].join("\n");
  }

  /** Associates a single command name or alias with a command, rejecting duplicates. */
  private registerName(name: string, command: Command): void {
    if (this.commands.has(name)) {
      throw new Error(`Command already registered: ${name}`);
    }

    this.commands.set(name, command);
  }

  /** Returns the configured default command used when no explicit command is provided. */
  private getDefaultCommand(): Command {
    const command = this.commands.get(this.defaultCommandName);

    if (!command) {
      throw new Error(
        `Default command is not registered: ${this.defaultCommandName}`,
      );
    }

    return command;
  }
}
