import {
  EntityCollection,
  entityIsSaved,
  EntityType,
  IBoard,
  Id,
  IFlowStep,
  ISaved,
  ITask,
  TaskOperators as TaskOperatorsBase,
} from 'todo-manager';
import { ITaskFilters } from '../../models';
import { asyncSort } from '../../lib';

export class TaskOperators extends TaskOperatorsBase {
  public get getOrFailByRegExp() {
    const entityOps = this.entity;
    return entityOps.getOrFailByRegExp<ITask>(EntityType.Task);
  }

  public get getCollectionByRegExp() {
    return this.entity.getCollectionByRegExp<ITask>(EntityType.Task);
  }

  public get getCollectionWithFilters() {
    const getCollectionByRegExp = this.getCollectionByRegExp.bind(this);
    const list = this.list.bind(this);
    const filterByRegExp = this.entity.filterByRegExp.bind(this);
    const filterCollection = this.entity.filterCollection.bind(this);
    const getFlowStep = this.getTaskStep.bind(this);
    return async ({ board, regexp, steps }: ITaskFilters) => {
      let entities: EntityCollection<ITask & ISaved>;

      // get minimal superset
      if (board !== undefined) {
        entities = board.tasks;
      } else if (regexp !== undefined) {
        entities = await getCollectionByRegExp(regexp);
      } else {
        entities = await list();
      }

      // filter
      if (board !== undefined) {
        entities = await filterCollection<ITask & ISaved>(({ id }) =>
          board.tasks.has(id),
        )(entities);
      }
      if (regexp !== undefined) {
        entities = await filterByRegExp(regexp)(entities);
      }
      if (steps !== undefined) {
        entities = await filterCollection<ITask & ISaved>(async (task) => {
          const flowStep = await getFlowStep(task);
          return flowStep !== undefined && steps.has(flowStep.id);
        })(entities);
      }

      // return
      return entities;
    };
  }

  public get getCollectionBoardMapping() {
    const getBoard = this.getBoard.bind(this);
    const boardCache: Map<Id, (IBoard & ISaved) | undefined> = new Map();
    const getCachedBoard = async (task: ITask & ISaved) => {
      if (!boardCache.has(task.id)) {
        boardCache.set(task.id, await getBoard(task));
      }
      return boardCache.get(task.id) as (IBoard & ISaved) | undefined;
    };

    return async (collection: EntityCollection<ITask & ISaved>) => {
      const taskBoards: Map<Id, IBoard & ISaved> = new Map();
      for (const task of collection.values()) {
        const board = await getCachedBoard(task);
        if (board !== undefined) {
          taskBoards.set(task.id, board);
        }
      }
      return taskBoards;
    };
  }

  public get asyncSort() {
    const asyncCompare = this.asyncCompare.bind(this);
    const getBoard = this.getBoard.bind(this);
    const getFlowStep = this.getTaskStep.bind(this);

    const boardCache: Map<Id, (IBoard & ISaved) | undefined> = new Map();
    const flowStepCache: Map<Id, (IFlowStep & ISaved) | undefined> = new Map();

    const getCachedBoard = async (task: ITask & ISaved) => {
      if (!boardCache.has(task.id)) {
        boardCache.set(task.id, await getBoard(task));
      }
      return boardCache.get(task.id) as (IBoard & ISaved) | undefined;
    };

    const getCachedFlowStep = async (task: ITask & ISaved) => {
      if (!flowStepCache.has(task.id)) {
        flowStepCache.set(task.id, await getFlowStep(task));
      }
      return flowStepCache.get(task.id) as (IFlowStep & ISaved) | undefined;
    };

    return asyncSort(asyncCompare(getCachedBoard, getCachedFlowStep));
  }

  /* First sort by board. Undefined board last.
   * If both have no board, sort by date.
   * If one have board and the other has not, first the one with board.
   * If boards are different, by board creation date.
   * - On same time, rely on comparison of the boards as entites.
   * If both are in same board sort by step. Undefined step last.
   * - If both have no steps, sort by date.
   * - If both have steps, sort by step order.
   *   - If both steps have same order, sort by date.
   */
  public get asyncCompare() {
    const compareEntities = this.entity.compare.bind(this.entity);
    return (
        getBoard: (
          task: ITask & ISaved,
        ) => Promise<(IBoard & ISaved) | undefined>,
        getFlowStep: (
          task: ITask & ISaved,
        ) => Promise<(IFlowStep & ISaved) | undefined>,
      ) =>
      async <E extends ITask>(a: E, b: E): Promise<number> => {
        if (!entityIsSaved(a) && !entityIsSaved(b)) {
          return compareEntities(a, b);
        } else if (!entityIsSaved(a) && entityIsSaved(b)) {
          return 1;
        } else if (entityIsSaved(a) && !entityIsSaved(b)) {
          return -1;
        }

        const boardA = await getBoard(a as ITask & ISaved);
        const boardB = await getBoard(b as ITask & ISaved);

        if (boardA === undefined && boardB !== undefined) {
          return 1;
        } else if (boardA !== undefined && boardB === undefined) {
          return -1;
        } else if (boardA === undefined && boardB === undefined) {
          // skip if chain
        } else if ((boardA as IBoard).id !== (boardB as IBoard).id) {
          const A = boardA as IBoard & ISaved;
          const B = boardB as IBoard & ISaved;
          if (A.createdAt.getTime() < B.createdAt.getTime()) {
            return -1;
          } else if (A.createdAt.getTime() > B.createdAt.getTime()) {
            return 1;
          }
          return compareEntities(A, B);
        } else if ((boardA as IBoard).id === (boardB as IBoard).id) {
          const flow = (boardA as IBoard).flow;

          const flowStepA = await getFlowStep(a as ITask & ISaved);
          const flowStepB = await getFlowStep(b as ITask & ISaved);
          if (flowStepA === undefined && flowStepB !== undefined) {
            return 1;
          } else if (flowStepA !== undefined && flowStepB === undefined) {
            return -1;
          } else if (flowStepA !== undefined && flowStepB !== undefined) {
            for (const flowStepId of flow.order) {
              if (flowStepId === flowStepA.id) {
                return -1;
              } else if (flowStepId === flowStepB.id) {
                return 1;
              }
            }
          }
        }
        return compareEntities(a, b);
      };
  }
}

export type TTaskOperators = TaskOperators;
