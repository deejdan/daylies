export type Command = {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  run: (args: string[]) => Promise<void>;
};
