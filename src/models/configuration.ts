interface IConfigurationFileStorageFiles {
  type: 'files';
  format: 'yaml';
  path: string;
}

export interface IConfigurationFile {
  format: string;
  storage: IConfigurationFileStorageFiles;
  allowColor?: boolean;
  fitToOutputWidth?: boolean;
  files?: string[];
}

export interface IPartialConfigurationFile
  extends Partial<IConfigurationFile> {}

export interface IConfiguration {
  storage: IConfigurationFileStorageFiles;
  view: {
    allowColor: boolean;
    fitToOutputWidth: boolean;
  };
}
export interface IPartialConfiguration {
  storage?: IConfigurationStateFileStorageFiles;
  view?: {
    allowColor?: boolean;
    fitToOutputWidth?: boolean;
  };
}

export interface IConfigurationStateFileStorageFiles
  extends IConfigurationFileStorageFiles {
  file: string;
}
export interface IConfigurationState {
  storage: IConfigurationStateFileStorageFiles;
  view: {
    allowColor: boolean;
    fitToOutputWidth: boolean;
  };
  files: string[];
}
