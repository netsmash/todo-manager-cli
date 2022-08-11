import { Command } from 'commander';
import { getContainer, getOperators } from '../../inversify.config';
import { AppMiddleware } from '../../models';
import { yamlSourceBinding } from './inversify.config';

export * from './inversify.config';
export { Identificators as YAMLIdentificators } from './identificators';

export const loadYAMLSource: AppMiddleware = (next) => async (command: Command) => {
  command.hook('preAction', async () => {
    const ops = await getOperators();
    const configuration = await ops.configuration.getConfiguration();

    const storageType = (configuration['storage'] && configuration['storage']['type']) || '' as String;
    if (storageType !== "files") {
      return;
    }
    const storageFormat = (configuration['storage'] && configuration['storage']['format']) || '' as String;
    if (storageFormat.toLowerCase() !== "yaml") {
      return;
    }

    const container = await getContainer();
    yamlSourceBinding(container);
  });
  return await next(command);
};
