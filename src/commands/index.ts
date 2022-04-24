import { Command } from 'commander';
import { TLoggingOperators, TYAMLCacheOperators } from '../operators';
import { getContainer, getOperators } from '../inversify.config';
import { asyncPipe } from '../lib';
import { addCreateCommands } from './create';
import { addRemoveCommands } from './remove';
import { addShowCommands } from './show';
import { Identificators } from '../identificators';
import { addMoveCommands } from './move';
import { addEditCommands } from './edit';

export const addMainCommand = (command: Command) => {
  command
    .version('v0.0.1', '-v, --version')
    .option('--no-color', 'Raw output without colors nor styles')
    .option(
      '--fit',
      'Force view to fit in current terminal width. It raises an error if it is not possible.',
    )
    .option('--no-fit', 'Not to force view to fit in current terminal width')
    .option('--debug', 'Output debug information');

  addShowCommands(
    command.command('show', { isDefault: true }).alias('list').alias('l'),
  );

  addCreateCommands(
    command.command('create').alias('new').alias('add').alias('c'),
  );

  addRemoveCommands(command.command('delete').alias('remove').alias('rm'));

  addMoveCommands(command.command('move').alias('mv'));

  addEditCommands(command.command('edit').alias('update').alias('e'));

  // pre action
  command.hook('preAction', async (thisCommand) => {
    // configure color
    const ops = await getOperators();
    const allowColor = thisCommand.opts()['color'];
    const fitToOutputWidth = thisCommand.opts()['fit'];
    await asyncPipe(
      ops.configuration.getConfiguration,
      ops.configuration.update({ view: { allowColor, fitToOutputWidth } }),
      ops.configuration.setConfiguration,
    )();
    // log start
    const container = await getContainer();
    const logging = container.get<TLoggingOperators>(
      Identificators.LoggingOperators,
    );
    logging.message('App Start');
  });

  // post action
  command.hook('postAction', async (thisCommand) => {
    const { terminal } = await getOperators();
    terminal.out('\n');

    const container = await getContainer();
    const logging = container.get<TLoggingOperators>(
      Identificators.LoggingOperators,
    );
    logging.message('App End');

    const debug = thisCommand.opts()['debug'];
    if (debug) {
      const fileCache = container.get<TYAMLCacheOperators>(
        Identificators.YAMLCacheOperators,
      );
      console.log('YAML Cache info');
      console.dir(fileCache.cacheInfo);
      console.log('LOGGING');
      console.log('Logged time:', logging.getRegisterTime(), 'ms');
    }
  });

  return command;
};
