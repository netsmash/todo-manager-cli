import { Command } from 'commander';
import { removeTask } from './task';
import { removeBoard } from './board';
import { removeFlow } from './flow';

export const addRemoveCommands = (removeCommand: Command): Command => {
  removeCommand
    .command('task [task...]', { isDefault: true })
    .alias('t')
    .description(`Delete one or more tasks.`)
    .option('-y, --confirm', 'Do not ask for confirmation.')
    .action(removeTask);
  removeCommand
    .command('board [board...]')
    .alias('b')
    .description(`Delete one or more board.`)
    .option('-r, --recursive', 'Remove also the associated tasks.')
    .option('-y, --confirm', 'Do not ask for confirmation.')
    .action(removeBoard);
  removeCommand
    .command('flow [flow...]')
    .alias('f')
    .description(
      `Delete one or more flows. By default, only flows without boards associated could be removed.`,
    )
    .option(
      '-b, --boards',
      'Remove the associated boards. Otherwise, if flow has some board associated, an error will be raised.',
    )
    .option('-r, --recursive', 'Remove also the associated tasks.')
    .option('-y, --confirm', 'Do not ask for confirmation.')
    .action(removeFlow);
  return removeCommand;
};
