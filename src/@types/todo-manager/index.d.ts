import {
  EntityCollection,
  EntityType,
  IEntityOperators as IEntityOperatorsBase,
} from 'todo-manager';
declare module 'todo-manager' {
  export type TFlowStepColor =
    | 'black'
    | 'red'
    | 'green'
    | 'yellow'
    | 'blue'
    | 'magenta'
    | 'cyan'
    | 'white'
    | 'grey'
    | 'redBright'
    | 'greenBright'
    | 'yellowBright'
    | 'blueBright'
    | 'magentaBright'
    | 'cyanBright'
    | 'whiteBright';

  export interface ISaved {
    id: Id;
    createdAt: Date;
  }

  export interface IEntity {
    id: Id;
    type: EntityType;
    createdAt?: Date;
    updatedAt?: Date;
    name: string;
    description?: string;
  }
  export interface IEntityCreationProps
    extends Omit<IEntity, 'id' | 'type' | 'createdAt'> {
    id?: Id;
  }
  export interface IEntityUpdateProps extends Partial<IEntityCreationProps> {}

  // task
  export interface ITask extends IEntity {
    type: EntityType.Task;
  }
  export interface ITaskCreationProps
    extends Omit<ITask, 'id' | 'type' | 'createdAt'>,
      IEntityCreationProps {}
  export interface ITaskUpdateProps
    extends Partial<ITaskCreationProps>,
      IEntityUpdateProps {}

  // flow step
  export interface IFlowStep extends IEntity {
    type: EntityType.FlowStep;
    color?: TFlowStepColor;
  }
  export interface IFlowStepCreationProps
    extends Omit<IFlowStep, 'id' | 'type' | 'createdAt'> {}
  export interface IFlowStepUpdateProps
    extends Partial<IFlowStepCreationProps> {}

  // flow
  export interface IFlow extends IEntity {
    type: EntityType.Flow;
    steps: EntityCollection<IFlowStep>;
    defaultStepId?: Id;
    order: Id[];
  }
  export interface IFlowCreationProps
    extends Omit<IFlow, 'id' | 'type' | 'createdAt'> {}
  export interface IFlowUpdateProps extends Partial<IFlowCreationProps> {}

  // board
  export interface IBoard extends IEntity {
    type: EntityType.Board;
    flow: IFlow;
    tasks: EntityCollection<ITask>;
    taskSteps: Map<Id, Id>;
  }

  export interface IBoardCreationProps
    extends Omit<IBoard, 'id' | 'type' | 'createdAt'> {}
  export interface IBoardUpdateProps extends Partial<IBoardCreationProps> {}

  /**
   * OPERATORS
   *
   */

  export interface IEntityOperators extends IEntityOperatorsBase {
    filterCollection: <E extends IEntity>(
      fn: (
        entity: E,
        id: Id,
        collection: EntityCollection<E>,
      ) => MaybePromise<boolean>,
    ) => (collection: EntityCollection<E>) => Promise<EntityCollection<E>>;
    filterByRegExp: (
      regexp: string | RegExp,
    ) => <E extends IEntity>(
      collection: EntityCollection<E & ISaved>,
    ) => Promise<EntityCollection<E & ISaved>>;
    getOrFailByRegExpFrom: <E extends IEntity>(
      type: E['type'],
    ) => (
      regexp: string | RegExp,
    ) => (collection: EntityCollection<E & ISaved>) => Promise<E & ISaved>;
    getOrFailByRegExp: <E extends IEntity>(
      type: E['type'],
    ) => (regexp: string | RegExp) => Promise<E & ISaved>;
    getCollectionByRegExp: <E extends IEntity>(
      type: E['type'],
    ) => (regexp: string | RegExp) => Promise<EntityCollection<E & ISaved>>;
    compare: (a: IEntity, b: IEntity) => number;
  }
}
