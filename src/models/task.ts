import { EntityCollection, IBoard, Id, IFlowStep, ISaved } from 'todo-manager';
import { IEntityFileSource } from './entity';

export interface ITaskFileSource extends IEntityFileSource {
  boardId?: Id;
}

export interface ITaskFilters {
  board?: IBoard & ISaved;
  regexp?: string | RegExp;
  steps?: EntityCollection<IFlowStep & ISaved>;
}
