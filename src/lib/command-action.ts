import { Command } from 'commander';

interface ICommandActionProps<TArguments extends any[], TOptions extends {}> {
  command: Command;
  args: TArguments;
  options: TOptions;
}

type TCommandAction<TArguments extends any[], TOptions extends {}> = (
  props: ICommandActionProps<TArguments, TOptions>,
) => Promise<void>;

export const commandAction = <
  TArguments extends any[] = any[],
  TOptions extends {} = {},
>(
  action: TCommandAction<TArguments, TOptions>,
) => {
  return async (...cmdArgs: any[]): Promise<void> => {
    const options: TOptions = cmdArgs[cmdArgs.length - 2];
    const command: Command = cmdArgs[cmdArgs.length - 1];
    const args: TArguments = cmdArgs.slice(0, -2) as TArguments;

    await action({ command, args, options });
  };
};
