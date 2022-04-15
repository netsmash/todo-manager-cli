#!/usr/bin/env node
import { Command } from 'commander';
import { TodoManagerError } from 'todo-manager';
import { CliError } from './errors';
import { addMainCommand } from './commands';

(async () => {
  const command = new Command();
  addMainCommand(command);

  // parse
  await command
    .parseAsync()
    .catch((error: Error) => {
      if (error instanceof CliError) {
        console.error(error.message);
      } else if (error instanceof TodoManagerError) {
        console.error(error.message);
      } else {
        console.log(error.stack);
        throw error;
      }
    })
    .finally(async () => {
      process.stdout.end();
      /*
      const serviceProvider = await getServiceProvider();
      serviceProvider.unbindAll();
      */
    });
})();
