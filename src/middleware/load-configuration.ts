import { Command } from "commander";
import { asyncPipe } from "../lib";
import { getOperators } from "../inversify.config";
import { AppMiddleware } from "../models/core";

export const loadAppConfiguration: AppMiddleware = (next) => async (command: Command) => {
  command.hook('preAction', async (command) => {
    const ops = await getOperators();
    const allowColor = command.opts()['color'];
    const fitToOutputWidth = command.opts()['fit'];
    await asyncPipe(
      ops.configuration.getConfiguration,
      ops.configuration.update({ view: { allowColor, fitToOutputWidth } }),
      ops.configuration.setConfiguration,
    )();
  });

  return await next(command);
};
