interface IConfigurationFileStorageFiles {
  type: 'files';
  format: 'yaml';
  path: string;
}

export interface IConfigurationFile {
  format: string;
  storage: IConfigurationFileStorageFiles;
  allowColor?: boolean;
  overrides?: string[];
}

export interface IPartialConfigurationFile extends Partial<IConfigurationFile> {}

export interface IConfiguration extends IConfigurationFile {}
