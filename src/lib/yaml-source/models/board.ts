import { Id } from 'todo-manager';
import { IEntityFileSource } from './entity';

export interface IBoardFileSource extends IEntityFileSource {
  flowId: Id;
  taskStepIds: { [index: Id]: Id };
}
