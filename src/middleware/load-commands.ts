import { Command } from "commander";
import { AppMiddleware } from "../models";
import { getOperators } from "../inversify.config";
import { addShowCommands } from "../commands/show";
import { addCreateCommands } from "../commands/create";
import { addRemoveCommands } from "../commands/remove";
import { addMoveCommands } from "../commands/move";
import { addEditCommands } from "../commands/edit";

export const loadAppCommands: AppMiddleware = (next) => async (command: Command) => {
  command
    .option('--color', 'Allow colors and styles on output')
    .option('--no-color', 'Raw output without colors nor styles')
    .option(
      '--fit',
      'Force view to fit in current terminal width. It raises an error if it is not possible.',
    )
    .option('--no-fit', 'Not to force view to fit in current terminal width')
    .option('--debug', 'Output debug information');

  addShowCommands(
    command.command('show', { isDefault: true }).alias('list').alias('l'),
  );

  addCreateCommands(
    command.command('create').alias('new').alias('add').alias('c'),
  );

  addRemoveCommands(command.command('delete').alias('remove').alias('rm'));

  addMoveCommands(command.command('move').alias('mv'));

  addEditCommands(command.command('edit').alias('update').alias('e'));

  command.hook('postAction', async () => {
    const { terminal } = await getOperators();
    terminal.out('\n');
  });

  return await next(command);
};
