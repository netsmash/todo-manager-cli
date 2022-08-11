import { Command } from 'commander';
import { AppMiddleware } from '../../models/core';

export const trello: AppMiddleware = (next) => async (command: Command) => {
  const commands = new Map<string, Command>(
    command.commands.map((command) => [command.name(), command]),
  );

  // [ 'show', 'create', 'delete', 'move', 'edit' ]
  const showCommand = commands.get('show');

  if (showCommand !== undefined) {
    showCommand.command('trello').action(async () => {});
  }

  command.command('trello').action(async () => {
    console.log('Hello world, trello!');
  });

  await preAction(command);
  await next(command);

  return command;
};

const preAction = async (_: Command) => {
  //const apiToken = "0c6eb79a1d8e5975ae4aaf47d26de83e";
};
