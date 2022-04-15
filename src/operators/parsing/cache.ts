import { inject, injectable } from 'inversify';
import { IBoard, Id, IFlowStep, ISaved, ITask } from 'todo-manager';
import { Identificators } from '../../identificators';
import { TBoardOperators, TTaskOperators } from '../todo-manager';

@injectable()
export class ParserCacheOperators {
  protected tm: {
    task: TTaskOperators;
    board: TBoardOperators;
  };
  public constructor(
    @inject(Identificators.tm.TaskOperators) tmTask: TTaskOperators,
    @inject(Identificators.tm.BoardOperators) tmBoard: TBoardOperators,
  ) {
    this.tm = {
      task: tmTask,
      board: tmBoard,
    };
  }

  protected taskBoards: Map<Id, (IBoard & ISaved) | undefined> = new Map();
  protected taskFlowStep: Map<Id, (IFlowStep & ISaved) | undefined> = new Map();

  public get clear() {
    const taskBoards = this.taskBoards;
    const taskFlowStep = this.taskFlowStep;
    return () => {
      taskBoards.clear();
      taskFlowStep.clear();
    };
  }

  public get getTaskBoard() {
    const boardCache = this.taskBoards;
    const getBoard = this.tm.task.getBoard.bind(this.tm.task);
    return async (task: ITask & ISaved) => {
      if (!boardCache.has(task.id)) {
        boardCache.set(task.id, await getBoard(task));
      }
      return boardCache.get(task.id) as (IBoard & ISaved) | undefined;
    };
  }

  public get getTaskStep() {
    const flowStepCache = this.taskFlowStep;
    const getTaskStep = this.tm.task.getTaskStep.bind(this.tm.task);
    return async (task: ITask & ISaved) => {
      if (!flowStepCache.has(task.id)) {
        flowStepCache.set(task.id, await getTaskStep(task));
      }
      return flowStepCache.get(task.id) as (IFlowStep & ISaved) | undefined;
    };
  }
}

export type TParserCacheOperators = ParserCacheOperators;
