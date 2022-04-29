import { Command } from "commander";
import { getContainer } from "../inversify.config";
import { AppMiddleware } from "../models/core";
import { Identificators } from "../identificators";
import { TLoggingOperators } from "../operators";

export const loadLogging: AppMiddleware = (next) => async (command: Command) => {
  command.hook('preAction', async () => {
    const container = await getContainer();
    const logging = container.get<TLoggingOperators>(
      Identificators.LoggingOperators,
    );
    logging.message('App Start');
  });

  command.hook('postAction', async () => {
    const container = await getContainer();
    const logging = container.get<TLoggingOperators>(
      Identificators.LoggingOperators,
    );
    logging.message('App End');

    const debug = command.opts()['debug'];
    if (debug) {
      console.log('\nLOGGING');
      console.log('Logged time:', logging.getRegisterTime(), 'ms');
    }

  });

  return await next(command);
};
