import { injectable } from 'inversify';
import YAML from 'yaml';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { homedir } from 'node:os';
import { join, dirname, normalize as normalizePath } from 'node:path';
import {
  IConfiguration,
  IConfigurationFile,
  IConfigurationState,
  IPartialConfiguration,
  IPartialConfigurationFile,
} from '../models';
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
  protected _value: IConfigurationState | undefined;
  public get state(): IConfigurationState {
    return this._value as IConfigurationState;
  }

  public get adaptConfigurationFromState() {
    return (state: IConfigurationState): IConfiguration => {
      return {
        ...state,
      };
    };
  }

  public get filePath() {
    const sanitizePath = this.sanitizePath.bind(this);
    return sanitizePath(join(this.dirPath, this.fileName));
  }

  public get getConfiguration() {
    const getCurrentValue = () => this._value;
    const setCurrentValue = (value: IConfigurationState) =>
      (this._value = value);
    const getOrCreate = this.getOrCreate.bind(this);
    const adaptConfigurationFromState =
      this.adaptConfigurationFromState.bind(this);
    return async (): Promise<IConfiguration> => {
      if (getCurrentValue() === undefined) {
        setCurrentValue(await getOrCreate());
      }
      return adaptConfigurationFromState(
        getCurrentValue() as IConfigurationState,
      );
    };
  }

  public get setConfiguration() {
    const setCurrentValue = (value: IConfigurationState) =>
      (this._value = value);
    const getCurrentValue = () => this._value;
    const update = this.updateState.bind(this);
    return (
      configuration: IPartialConfiguration | IConfiguration,
    ): IConfigurationState => {
      const currentValue = getCurrentValue() as IConfigurationState;
      const updatedValue = update(configuration)(currentValue);
      setCurrentValue(updatedValue);
      return getCurrentValue() as IConfigurationState;
    };
  }

  public get replaceVariables() {
    return (filePath: string) => (str: string): string => {
      return str
        .replace('${HOME}', homedir())
        .replace('${DIRNAME}', dirname(filePath));
    }
  }

  public get sanitizePath() {
    return (path: string): string => {
      return normalizePath(path);
    }
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
    const sanitizePath = this.sanitizePath.bind(this);
    return (
        partial: IPartialConfiguration | IConfiguration | null | undefined,
      ) =>
      (configuration: IConfiguration): IConfiguration => {
        partial = partial || {};
        let storage: IConfiguration['storage'] = configuration.storage;
        if (partial.storage !== undefined) {
          storage = { ...storage, ...partial.storage };
          storage.path = sanitizePath(storage.path);
        }
        let view: IConfigurationState['view'] = configuration.view;
        if (partial.view !== undefined) {
          for (const k of Object.keys(partial.view)) {
            const key = k as keyof IPartialConfiguration['view'];
            if (partial.view[key] === undefined) {
              delete partial.view[key];
            }
          }
          view = { ...view, ...partial.view };
        }
        return {
          storage,
          view,
        };
      };
  }

  public get updateState() {
    const sanitizePath = this.sanitizePath.bind(this);
    return (
        partial: IPartialConfiguration | IConfiguration | null | undefined,
      ) =>
      (configuration: IConfigurationState): IConfigurationState => {
        partial = partial || {};
        let storage: IConfigurationState['storage'] = configuration.storage;
        if (partial.storage !== undefined) {
          storage = { ...storage, ...partial.storage };
          storage.path = sanitizePath(storage.path);
          storage.file = sanitizePath(storage.file);
        }
        let view: IConfigurationState['view'] = configuration.view;
        if (partial.view !== undefined) {
          view = { ...view, ...partial.view };
        }
        return {
          storage,
          view,
          files: configuration.files,
        };
      };
  }

  public get updateStateFromFile() {
    const sanitizePath = this.sanitizePath.bind(this);
    return (
        partial: IPartialConfigurationFile | null | undefined,
        filePath: string,
      ) =>
      (configuration: IConfigurationState): IConfigurationState => {
        partial = partial || {};
        let storage: IConfigurationState['storage'] = configuration.storage;
        if (partial.storage !== undefined) {
          storage = { ...partial.storage, file: filePath };
          storage.path = sanitizePath(storage.path);
          storage.file = sanitizePath(storage.file);
        }
        const view: IConfigurationState['view'] = configuration.view;
        if (partial.allowColor !== undefined) {
          view.allowColor = partial.allowColor;
        }
        if (partial.fitToOutputWidth !== undefined) {
          view.fitToOutputWidth = partial.fitToOutputWidth;
        }
        return {
          storage,
          view,
          files: Array.from(
            new Set([...(configuration.files || []), ...(partial.files || []).map(sanitizePath)]),
          ),
        };
      };
  }

  public get read() {
    const defaultFilePath = this.filePath;
    const replaceVariables = this.replaceVariables.bind(this);

    return async (
      filePath: string = defaultFilePath,
    ): Promise<IConfigurationFile | undefined> => {
      let configuration: IConfigurationFile | undefined;
      try {
        const configurationStr = replaceVariables(filePath)(
          await readFile(filePath, { encoding: 'utf-8' })
        );
        configuration = YAML.parse(configurationStr);
      } catch (error) {
        // assume file do not exists
      }
      return configuration;
    };
  }

  public get getOrCreate() {
    const defaultFilePath = this.filePath;
    const sanitizePath = this.sanitizePath.bind(this);
    const replaceVariables = this.replaceVariables.bind(this);
    const dirPath = this.dirPath;
    const write = this.write.bind(this);
    const read = this.read.bind(this);
    const update = this.updateStateFromFile.bind(this);

    return async (): Promise<IConfigurationState> => {
      let configurationFile: IConfigurationFile;
      const obtainedConfiguration = await read(defaultFilePath);
      if (obtainedConfiguration === undefined) {
        // assume file do not exists
        await mkdir(dirPath, { recursive: true });
        configurationFile = defaultConfiguration as IConfigurationFile;
        configurationFile.storage.path = replaceVariables(defaultFilePath)(
          configurationFile.storage.path
        );
        await write(configurationFile);
      } else {
        configurationFile = obtainedConfiguration;
      }
      // transform configuration file into a state
      let configurationState: IConfigurationState = {
        storage: {
          ...configurationFile.storage,
          file: defaultFilePath,
        },
        view: {
          allowColor: true,
          fitToOutputWidth: true,
        },
        files: [],
      };
      const alreadyVisited: Set<string> = new Set();
      let files: string[] = [sanitizePath(defaultFilePath)];
      while (files.length > 0) {
        for (const _filePath of files) {
          const filePath = sanitizePath(_filePath);
          // get partial conf
          const partial = await read(filePath);
          // update configuration
          if (partial !== undefined) {
            configurationState = update(partial, filePath)(configurationState);
          }
          // mark as visited
          alreadyVisited.add(filePath);
        }
        // remove already visited files
        files = configurationState.files.filter(
          (file) => !alreadyVisited.has(file),
        );
      }
      return configurationState;
    };
  }
}

export type TConfigurationOperators = ConfigurationOperators;
