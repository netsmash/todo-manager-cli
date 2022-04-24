import { Command } from 'commander';
import { showBoard } from './board';
import { showFlow } from './flow';
import { showTask } from './task';
import { showConfiguration } from './configuration';

export const addShowCommands = (showCommand: Command): Command => {
  showCommand
    .command('board [board-id]')
    .alias('boards')
    .alias('b')
    .option(
      '-f, --filter <regexp>',
      'Filter results by matching regexp with id and title. This argument is ignored if the [board-id] argument is provided.',
    )
    .action(showBoard);

  showCommand
    .command('task [task-id]', { isDefault: true })
    .alias('tasks')
    .alias('t')
    .option(
      '-f, --filter <regexp>',
      'Filter results by matching regexp with id and title. This argument is ignored if the [task-id] argument is provided.',
    )
    .option(
      '-b, --board <board>',
      'Filter results by a board. This argument is ignored if the [task-id] argument is provided.',
    )
    .option(
      '-s, --steps <steps...>',
      'Filter results by a steps. This argument is ignored if the [task-id] argument is provided.',
    )
    .action(showTask);

  showCommand
    .command('flow [flow-id]')
    .alias('flows')
    .alias('f')
    .option(
      '-f, --filter <regexp>',
      'Filter results by matching regexp with id and name. This argument is ignored if the [flow-id] argument is provided.',
    )
    .action(showFlow);

  showCommand
    .command('configuration')
    .description(`Shows information about the current configuration.`)
    .aliases(['config', 'conf'])
    .action(showConfiguration);

  return showCommand;
};
