import { TFlowStepColor } from 'todo-manager';
import { IEntityFileSource } from './entity';

export interface IFlowStepFileSource extends IEntityFileSource {
  color?: TFlowStepColor;
}
