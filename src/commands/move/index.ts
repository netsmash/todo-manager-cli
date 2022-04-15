import { Command } from 'commander';
import { moveTask } from './task';

export const addMoveCommands = (moveCommand: Command): Command => {
  moveCommand
    .command('task [task...]')
    .alias('t')
    .description(
      `Move one or more tasks to a board or step. Either -b or -s options should be provided.`,
    )
    .option(
      '-o, --orphan',
      'Disattach tasks from their boards, if any. Other flags will be ignored.',
    )
    .option(
      '-b, --board <board>',
      'Attaches tasks to the board. If the flow associated to the board has not default step, an `-s` should be provided.',
    )
    .option(
      '-s, --step <step>',
      'Attaches the task to a particular state of the board.',
    )
    .action(moveTask);
  return moveCommand;
};
