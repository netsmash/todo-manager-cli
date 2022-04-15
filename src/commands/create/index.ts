import { Command } from 'commander';
import { createTask } from './task';
import { createBoard } from './board';
import { createFlow } from './flow';

export const addCreateCommands = (createCommand: Command): Command => {
  createCommand
    .command('task [task-id]')
    .alias('t')
    .description(`Creates a task.`)
    .option(
      '-b, --board <board>',
      'Attaches the task to the board. If the flow associated to the board has not default step, an `-s` should be provided.',
    )
    .option(
      '-s, --step <board>',
      'Attaches the task to a particular state of the board. The `-b` option should be provided.',
    )
    .option(
      '-n, --name <name>',
      'Set name on the created task. Prevents te editor to be opened.',
    )
    .action(createTask);

  createCommand
    .command('board <flow> [board-id]')
    .alias('b')
    .description(`Creates a board associated to <flow>.`)
    .option(
      '-n, --name <name>',
      'Set name on the created board. Prevents te editor to be opened.',
    )
    .action(createBoard);

  createCommand
    .command('flow [flow-id]')
    .alias('f')
    .description(`Creates a new flow.`)
    .option('-n, --name <name>', 'Set name on the created flow.')
    .action(createFlow);

  return createCommand;
};
