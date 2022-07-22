import { EntityCollection, IBoard, IFlowStep, ISaved } from 'todo-manager';

export interface ITaskFilters {
  board?: IBoard & ISaved;
  regexp?: string | RegExp;
  steps?: EntityCollection<IFlowStep & ISaved>;
}
