export interface IConfigurationFile {
  format: string;
  allowColor?: boolean;
  fitToOutputWidth?: boolean;
  files?: string[];
  [key: string]: any;
}

export interface IPartialConfigurationFile
  extends Partial<IConfigurationFile> {}

export interface IConfiguration {
  view: {
    allowColor: boolean;
    fitToOutputWidth: boolean;
  };
  [key: string]: any;
}
export interface IPartialConfiguration {
  view?: {
    allowColor?: boolean;
    fitToOutputWidth?: boolean;
  };
  [key: string]: any;
}
export interface IConfigurationState {
  view: {
    allowColor: boolean;
    fitToOutputWidth: boolean;
  };
  files: string[];
  [key: string]: any;
}
