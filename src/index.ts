#!/usr/bin/env node
import { loadYAMLSource } from './lib/yaml-source';
import { App } from './core';
import { loadAppCommands, loadAppConfiguration, loadLogging } from './middleware';

(async () => {
  const app = new App();
  app.addMiddleware(loadAppCommands)
    .addMiddleware(loadAppConfiguration)
    .addMiddleware(loadYAMLSource)
    .addMiddleware(loadLogging)
  await app.run();
  process.stdout.end();
})();
