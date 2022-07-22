import { injectable, interfaces } from 'inversify';
import { NotImplementedError, EntityType } from 'todo-manager';
import { join } from 'node:path';
import { Identificators } from '../../identificators';
import type { TConfigurationOperators } from '../../operators';
import { IYAMLStorageConfig } from './models';

@injectable()
export class YAMLConfigurationOperators {

  public constructor(protected context: interfaces.Context) {
  }

  protected get configuration(): TConfigurationOperators {
    return this.context.container.get<TConfigurationOperators>(
      Identificators.ConfigurationOperators,
    );
  }

  public get getFilePath() {
    const getConfigurationState = () => this.configuration.state;
    return async (type: EntityType): Promise<string> => {
      const configuration = getConfigurationState();
      const storageConfiguration = configuration[
        'storage'
      ] as IYAMLStorageConfig;
      const dirPath = storageConfiguration.path;
      let filePath: string;
      if (type === EntityType.Task) {
        filePath = join(dirPath, 'tasks.yml');
      } else if (type === EntityType.FlowStep) {
        filePath = join(dirPath, 'flowSteps.yml');
      } else if (type === EntityType.Flow) {
        filePath = join(dirPath, 'flows.yml');
      } else if (type === EntityType.Board) {
        filePath = join(dirPath, 'boards.yml');
      } else {
        throw new NotImplementedError(
          'YAMLFileSourceOperators.filePath() pending for implementation',
        );
      }

      return filePath;
    };
  }
}

export type TYAMLConfigurationOperators = YAMLConfigurationOperators;
