import { Command } from 'commander';
import { TodoManagerError } from 'todo-manager';
import { CliError } from './errors';
import { AppMiddleware, AppComposedMiddleware } from './models/core';
import packageJson from '../package.json';

export class App {
  protected middlewareStack: AppMiddleware[] = [];

  public addMiddleware(middleware: AppMiddleware) {
    this.middlewareStack.push(middleware);
    return this;
  }

  public async run() {
    let composedMiddleware: AppComposedMiddleware = this.runner;
    for (let i = this.middlewareStack.length - 1; i >= 0; i--) {
      const middleware = this.middlewareStack[i] as AppMiddleware;
      composedMiddleware = middleware(composedMiddleware);
    }
    await composedMiddleware(new Command().version(packageJson.version));
    return this;
  }

  protected get runner(): AppComposedMiddleware {
    return async (command: Command) =>
      command
        .parseAsync()
        .catch((error: Error): never => {
          if (error instanceof CliError) {
            console.error(error.message);
            process.exit(1);
          } else if (error instanceof TodoManagerError) {
            console.error(error.message);
            process.exit(1);
          } else {
            console.log(error.stack);
            throw error;
          }
        })
        .finally(async () => {
          /*
        const serviceProvider = await getServiceProvider();
        serviceProvider.unbindAll();
        */
        });
  }
}
