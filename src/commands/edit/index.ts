import { Command } from 'commander';
import { editBoard } from './board';
import { editTask } from './task';
import { editFlow } from './flow';

export const addEditCommands = (editCommand: Command): Command => {
  editCommand
    .command('task <task>')
    .alias('t')
    .description(`Edits a task.`)
    .option(
      '-n, --name <name>',
      'Set name on the edited task. Prevents te editor to be opened.',
    )
    .action(editTask);

  editCommand
    .command('board <board>')
    .alias('b')
    .description(`Edits a board.`)
    .option(
      '-n, --name <name>',
      'Set name on the edited board. Prevents te editor to be opened.',
    )
    .action(editBoard);

  editCommand
    .command('flow <flow>')
    .alias('f')
    .description(`Edits a flow.`)
    .option(
      '-n, --name <name>',
      'Set name on the edited flow. Prevents te editor to be opened.',
    )
    .action(editFlow);

  return editCommand;
};
