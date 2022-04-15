import { Id } from 'todo-manager';
import { IEntityFileSource } from './entity';

export interface IFlowFileSource extends IEntityFileSource {
  stepIds: Id[];
  defaultStepId?: Id;
}
