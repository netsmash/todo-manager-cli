import { injectable } from 'inversify';
import YAML from 'yaml';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { IConfiguration, IConfigurationFile, IPartialConfigurationFile } from '../models';
import defaultConfiguration from '../templates/default-config.json';

@injectable()
export class ConfigurationOperators {
  public readonly fileName = 'todo-manager.yml';
  public readonly secondaryFileName = 'tm.config.yml';
  public readonly dirPath = join(homedir(), '.config');
  public readonly yamlOptions: YAML.DocumentOptions &
    YAML.SchemaOptions &
    YAML.ParseOptions &
    YAML.CreateNodeOptions &
    YAML.ToStringOptions = {
    blockQuote: 'literal',
  };
  protected _value: IConfigurationFile | undefined;

  public get filePath() {
    return join(this.dirPath, this.fileName);
  }

  public get getConfiguration() {
    const getCurrentValue = () => this._value;
    const setCurrentValue = (value: IConfigurationFile) => (this._value = value);
    const getOrCreate = this.getOrCreate.bind(this);
    return async (): Promise<IConfiguration> => {
      if (getCurrentValue() === undefined) {
        setCurrentValue(await getOrCreate());
      }
      return getCurrentValue() as IConfiguration;
    };
  }

  public get setConfiguration() {
    const setCurrentValue = (value: IConfigurationFile) => (this._value = value);
    const getCurrentValue = () => this._value;
    return (configuration: IConfiguration) => {
      setCurrentValue(configuration);
      return getCurrentValue() as IConfiguration;
    };
  }

  public get write() {
    const yamlOptions = this.yamlOptions;
    const filePath = this.filePath;
    return async (configuration: IConfigurationFile) => {
      const configurationStr = YAML.stringify(configuration, yamlOptions);
      await writeFile(filePath, configurationStr, { encoding: 'utf-8' });
    };
  }

  public get update() {
    return (partial: IPartialConfigurationFile | null | undefined) =>
      (configuration: IConfigurationFile) => {
        partial = partial || {};
        return {
          format: configuration.format,
          allowColor: partial.allowColor ?? configuration.allowColor,
          storage: partial.storage ?? configuration.storage,
          overrides: Array.from(
            new Set([
              ...(configuration.overrides || []),
              ...(partial.overrides || []),
            ]),
          ),
        } as IConfigurationFile;
      };
  }

  public get read() {
    const defaultFilePath = this.filePath;

    return async (
      filePath: string = defaultFilePath,
    ): Promise<IConfigurationFile | undefined> => {
      let configuration: IConfigurationFile | undefined;
      try {
        const configurationStr = (
          await readFile(filePath, { encoding: 'utf-8' })
        ).replace('${HOME}', homedir());
        configuration = YAML.parse(configurationStr);
      } catch (error) {
        // assume file do not exists
      }
      return configuration;
    };
  }

  public get getOrCreate() {
    const dirPath = this.dirPath;
    const write = this.write.bind(this);
    const read = this.read.bind(this);
    const update = this.update.bind(this);

    return async (): Promise<IConfigurationFile> => {
      let configuration: IConfigurationFile;
      const obtainedConfiguration = await read();
      if (obtainedConfiguration === undefined) {
        // assume file do not exists
        await mkdir(dirPath, { recursive: true });
        configuration = defaultConfiguration as IConfigurationFile;
        configuration.storage.path = configuration.storage.path.replace(
          '${HOME}',
          homedir(),
        );
        await write(configuration);
      } else {
        configuration = obtainedConfiguration;
      }
      const alreadyVisited: Set<string> = new Set();
      let overrides: string[] = configuration.overrides || [];
      while (overrides.length > 0) {
        for (const overridePath of overrides) {
          // get partial conf
          const partial = await read(overridePath);
          // update configuration
          if (partial !== undefined) {
            configuration = update(partial)(configuration);
          }
          // mark as visited
          alreadyVisited.add(overridePath);
        }
        // remove already visited overrides
        overrides = (configuration.overrides || []).filter(
          (override) => !alreadyVisited.has(override),
        );
      }
      return configuration;
    };
  }
}

export type TConfigurationOperators = ConfigurationOperators;
