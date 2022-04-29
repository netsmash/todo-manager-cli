#!/usr/bin/env node
import { main } from './commands';
import { trello } from './lib/trello';
import { App } from './core';

(async () => {
  const app = new App();
  app.addMiddleware(main).addMiddleware(trello);
  await app.run();
  process.stdout.end();
})();
