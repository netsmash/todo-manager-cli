import { Command } from 'commander';

export type AppComposedMiddleware = (command: Command) => Promise<Command>;
export type AppMiddleware = (
  next: AppComposedMiddleware,
) => AppComposedMiddleware;
