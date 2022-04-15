import { injectable } from 'inversify';
import {
  EntityType,
  IBoard,
  Id,
  IEntity,
  IFlow,
  IFlowStep,
  ISaved,
  isBoard,
  isFlow,
  isFlowStep,
  isTask,
  ITask,
  NotImplementedError,
} from 'todo-manager';

@injectable()
export class EntityCacheOperators {
  protected tasks: Map<Id, ITask & ISaved> = new Map();
  protected steps: Map<Id, IFlowStep & ISaved> = new Map();
  protected flows: Map<Id, IFlow & ISaved> = new Map();
  protected boards: Map<Id, IBoard & ISaved> = new Map();
  protected loadedLists: Set<EntityType> = new Set();

  public get get() {
    const tasks = this.tasks;
    const steps = this.steps;
    const flows = this.flows;
    const boards = this.boards;
    return <E extends IEntity & ISaved>(id: Id): E | undefined => {
      return (tasks.get(id) ||
        steps.get(id) ||
        flows.get(id) ||
        boards.get(id)) as E | undefined;
    };
  }
  public get set() {
    const tasks = this.tasks;
    const steps = this.steps;
    const flows = this.flows;
    const boards = this.boards;
    return <E extends IEntity & ISaved>(entity: E) => {
      if (isTask(entity)) {
        tasks.set(entity.id, entity);
      } else if (isFlowStep(entity)) {
        steps.set(entity.id, entity);
      } else if (isFlow(entity)) {
        flows.set(entity.id, entity);
      } else if (isBoard(entity)) {
        boards.set(entity.id, entity);
      }
    };
  }
  public get delete() {
    const tasks = this.tasks;
    const steps = this.steps;
    const flows = this.flows;
    const boards = this.boards;
    return (id: Id) => {
      tasks.delete(id);
      steps.delete(id);
      flows.delete(id);
      boards.delete(id);
    };
  }
  public get list() {
    const tasks = this.tasks;
    const steps = this.steps;
    const flows = this.flows;
    const boards = this.boards;
    const loadedLists = this.loadedLists;
    return <E extends IEntity>(
      type: E['type'],
    ): Iterable<E & ISaved> | undefined => {
      if (!loadedLists.has(type)) {
        return undefined;
      } else if (type === EntityType.Task) {
        return Array.from(tasks.values()) as unknown as (E & ISaved)[];
      } else if (type === EntityType.FlowStep) {
        return Array.from(steps.values()) as unknown as (E & ISaved)[];
      } else if (type === EntityType.Flow) {
        return Array.from(flows.values()) as unknown as (E & ISaved)[];
      } else if (type === EntityType.Board) {
        return Array.from(boards.values()) as unknown as (E & ISaved)[];
      }
      throw new NotImplementedError(
        'EntityCacheOperators.list() pending for implementation',
      );
    };
  }
  public get setList() {
    const loadedLists = this.loadedLists;
    const set = this.set.bind(this);
    return <E extends IEntity>(type: E['type']) =>
      (entities: Iterable<E & ISaved>) => {
        loadedLists.add(type);
        Array.from(entities).forEach(set);
      };
  }
}

export type TEntityCacheOperators = EntityCacheOperators;
