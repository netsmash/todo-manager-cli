import { IFlow, ISaved, TFlowStepColor } from 'todo-manager';

export const FlowStepColors = new Set<string>([
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'grey',
  'redBright',
  'greenBright',
  'yellowBright',
  'blueBright',
  'magentaBright',
  'cyanBright',
  'whiteBright',
]);

export interface IFlowStepFilters {
  flow?: IFlow & ISaved;
  regexp?: string | RegExp;
}

export const isFlowStepColor = (obj: any): obj is TFlowStepColor =>
  typeof obj === 'string' && FlowStepColors.has(obj);
