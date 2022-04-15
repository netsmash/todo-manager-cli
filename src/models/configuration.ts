interface IConfigurationStorageFiles {
  type: 'files';
  format: 'yaml';
  path: string;
}

export interface IConfiguration {
  format: string;
  storage: IConfigurationStorageFiles;
  allowColor?: boolean;
  overrides?: string[];
}

export interface IPartialConfiguration extends Partial<IConfiguration> {}
