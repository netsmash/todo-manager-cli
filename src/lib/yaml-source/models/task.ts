import { Id } from 'todo-manager';
import { IEntityFileSource } from './entity';

export interface ITaskFileSource extends IEntityFileSource {
  boardId?: Id;
}
