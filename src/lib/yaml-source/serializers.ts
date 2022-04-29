import { injectable, interfaces } from 'inversify';
import {
  entityIsSaved,
  EntityType,
  IBoard,
  Id,
  IEntity,
  IFlow,
  IFlowStep,
  ISaved,
  ISourceOperators,
  ITask,
  NotImplementedError,
  SavingRequiredError,
} from 'todo-manager';
import { Identificators } from '../../identificators';
import {
  IBoardFileSource,
  IEntityFileSource,
  IFlowFileSource,
  IFlowStepFileSource,
  ITaskFileSource,
} from './models';
import { TLoggingOperators, TFlowOperators } from '../../operators';
import { asyncFilter, asyncPipe, asyncQueuedMap } from '../../lib';

@injectable()
export class FileSourceSerializingOperators {
  protected container: interfaces.Container;

  public constructor(context: interfaces.Context) {
    this.container = context.container;
  }
  protected get source(): ISourceOperators {
    return this.container.get<ISourceOperators>(Identificators.tm.Source);
  }
  protected get flow(): TFlowOperators {
    return this.container.get<TFlowOperators>(Identificators.tm.FlowOperators);
  }
  protected get log(): TLoggingOperators {
    return this.container.get<TLoggingOperators>(
      Identificators.LoggingOperators,
    );
  }

  public get serialize() {
    const logging = this.log;
    const serializeTask = this.serializeTask.bind(this);
    const serializeFlowStep = this.serializeFlowStep.bind(this);
    const serializeFlow = this.serializeFlow.bind(this);
    const serializeBoard = this.serializeBoard.bind(this);
    return logging.logAsyncOperation('Serialize')(
      async <EFS extends IEntityFileSource, E extends IEntity>(
        entity: E & ISaved,
      ): Promise<EFS> => {
        if (entity.type === EntityType.Task) {
          return (await serializeTask(entity as ITask & ISaved)) as EFS;
        } else if (entity.type === EntityType.FlowStep) {
          return (await serializeFlowStep(entity as IFlowStep & ISaved)) as EFS;
        } else if (entity.type === EntityType.Flow) {
          const flow = entity as unknown as IFlow & ISaved;
          return (await serializeFlow(flow)) as unknown as EFS;
        } else if (entity.type === EntityType.Board) {
          const board = entity as unknown as IBoard & ISaved;
          return (await serializeBoard(board)) as unknown as EFS;
        }
        throw new NotImplementedError(
          'FileSourceSerializingOperators.serialize() pending for implementation',
        );
      },
    );
  }

  public get deserialize() {
    const logging = this.log;
    const deserializeTask = this.deserializeTask.bind(this);
    const deserializeFlowStep = this.deserializeFlowStep.bind(this);
    const deserializeFlow = this.deserializeFlow.bind(this);
    const deserializeBoard = this.deserializeBoard.bind(this);
    return logging.logAsyncOperation('Deserialize')(
      async <E extends IEntity, EFS extends IEntityFileSource>(
        data: EFS,
      ): Promise<E & ISaved> => {
        if (data.type === EntityType.Task) {
          return (await deserializeTask(data as ITaskFileSource)) as E & ISaved;
        } else if (data.type === EntityType.FlowStep) {
          return (await deserializeFlowStep(data as IFlowStepFileSource)) as E &
            ISaved;
        } else if (data.type === EntityType.Flow) {
          const fileFlow = data as unknown as IFlowFileSource;
          return (await deserializeFlow(fileFlow)) as unknown as E & ISaved;
        } else if (data.type === EntityType.Board) {
          const fileBoard = data as unknown as IBoardFileSource;
          return (await deserializeBoard(fileBoard)) as unknown as E & ISaved;
        }
        throw new NotImplementedError(
          'FileSourceSerializingOperators.deserialize() pending for implementation',
        );
      },
    );
  }

  /**
   * Entity
   */
  public get serializeEntity() {
    const logging = this.log;
    return logging.logAsyncOperation('Serialize Entity')(
      async (entity: IEntity & ISaved): Promise<IEntityFileSource> => {
        logging.message(entity.id);
        const data: IEntityFileSource = {
          id: entity.id,
          type: entity.type,
          name: entity.name,
          createdAt: entity.createdAt.getTime(),
        };
        if (entity.updatedAt !== undefined) {
          data.updatedAt = entity.updatedAt.getTime();
        }
        if (entity.description !== undefined) {
          data.description = entity.description;
        }
        return data;
      },
    );
  }

  public get deserializeEntity() {
    const logging = this.log;
    return logging.logAsyncOperation('Deserialize Entity')(
      async (data: IEntityFileSource): Promise<IEntity & ISaved> => {
        logging.message(data.id);
        const entity: IEntity & ISaved = {
          id: data.id,
          type: data.type,
          name: data.name,
          createdAt: new Date(data.createdAt),
        };

        if (data.updatedAt !== undefined) {
          entity.updatedAt = new Date(data.updatedAt);
        }
        if (data.description !== undefined) {
          entity.description = data.description;
        }
        return entity;
      },
    );
  }

  /**
   * Task
   */

  public get serializeTask() {
    const logging = this.log;
    const serializeEntity = this.serializeEntity.bind(this);
    const getBoard = this.source.getTaskBoard as (
      id: Id,
    ) => Promise<(IBoard & ISaved) | undefined>;
    return logging.logAsyncOperation('Serialize Task')(
      async (task: ITask & ISaved): Promise<ITaskFileSource> => {
        const data: ITaskFileSource = await serializeEntity(task);
        const board = await getBoard(task.id);
        if (board !== undefined) {
          data.boardId = board.id;
        }
        return data;
      },
    );
  }

  public get deserializeTask() {
    const logging = this.log;
    const deserializeEntity = this.deserializeEntity.bind(this);
    return logging.logAsyncOperation('Deserialize Task')(
      async (data: ITaskFileSource): Promise<ITask & ISaved> => {
        logging.message(data.id);
        return (await deserializeEntity(data)) as ITask & ISaved;
      },
    );
  }

  /**
   * Flow Step
   */

  public get serializeFlowStep() {
    const logging = this.log;
    const serializeEntity = this.serializeEntity.bind(this);
    return logging.logAsyncOperation('Serialize FlowStep')(
      async (entity: IFlowStep & ISaved): Promise<IFlowStepFileSource> => {
        const data: any = {
          ...(await serializeEntity(entity)),
          name: entity.name,
        };
        if ('color' in entity) {
          data.color = entity.color;
        }
        return data;
      },
    );
  }

  public get deserializeFlowStep() {
    const logging = this.log;
    const deserializeEntity = this.deserializeEntity.bind(this);
    return logging.logAsyncOperation('Deserialize FlowStep')(
      async (data: IFlowStepFileSource): Promise<IFlowStep & ISaved> => {
        logging.message(data.id);
        const item: IFlowStep & ISaved = {
          ...(await deserializeEntity(data as IEntityFileSource)),
          name: data.name,
        } as IFlowStep & ISaved;
        if ('color' in data) {
          item.color = data.color;
        }
        return item;
      },
    );
  }

  /**
   * Flow
   */
  public get serializeFlow() {
    const logging = this.log;
    const serializeEntity = this.serializeEntity.bind(this);
    return logging.logAsyncOperation('Serialize Flow')(
      async (entity: IFlow & ISaved): Promise<IFlowFileSource> => {
        const stepIds: Id[] = Array.from(entity.steps.values()).map(
          (entity: IFlowStep & ISaved) => entity.id,
        );
        const data: IFlowFileSource = {
          ...(await serializeEntity(entity)),
          name: entity.name,
          stepIds,
        };
        if (entity.defaultStepId !== undefined) {
          data.defaultStepId = entity.defaultStepId;
        }
        return data;
      },
    );
  }

  public get deserializeFlow() {
    const logging = this.log;
    const deserializeEntity = this.deserializeEntity.bind(this);
    const getFlowStep = this.source.get(EntityType.FlowStep);
    return logging.logAsyncOperation('Deserialize Flow')(
      async (data: IFlowFileSource): Promise<IFlow & ISaved> => {
        logging.message(data.id);
        const stepsArr = await asyncPipe(
          () => data.stepIds,
          asyncQueuedMap(getFlowStep),
          asyncFilter<(IEntity & ISaved) | undefined, IFlowStep & ISaved>(
            (flowStep) => flowStep !== undefined,
          ),
        )();
        const order = stepsArr.map((step) => step.id);
        const steps: Map<Id, IFlowStep & ISaved> = new Map(
          stepsArr.map((flowStep) => [flowStep.id, flowStep]),
        );

        const item = {
          ...(await deserializeEntity(data as IEntityFileSource)),
          name: data.name,
          steps,
          order,
        } as IFlow & ISaved;
        if (data.defaultStepId !== undefined) {
          item.defaultStepId = data.defaultStepId;
        }
        return item;
      },
    );
  }

  /**
   * Board
   */

  protected get serializeTaskStepsMap() {
    return (taskSteps: Map<Id, Id>): { [index: Id]: Id } => {
      const data: { [index: Id]: Id } = {};
      taskSteps.forEach((value, key) => (data[key] = value));
      return data;
    };
  }

  protected get deserializeTaskStepsMap() {
    return (data: { [index: Id]: Id }): Map<Id, Id> => {
      const taskSteps = new Map<Id, Id>();
      for (const [key, value] of Object.entries(data)) {
        taskSteps.set(key, value);
      }
      return taskSteps;
    };
  }

  public get serializeBoard() {
    const logging = this.log;
    const serializeEntity = this.serializeEntity.bind(this);
    const serializeTaskStepsMap = this.serializeTaskStepsMap.bind(this);
    return logging.logAsyncOperation('Serialize Board')(
      async (entity: IBoard & ISaved): Promise<IBoardFileSource> => {
        logging.message(entity.id);
        const taskStepIds = serializeTaskStepsMap(entity.taskSteps);
        if (!entityIsSaved(entity.flow)) {
          throw new SavingRequiredError(
            `On serializing board expected flow to be saved`,
          );
        }
        const flowId = entity.flow.id as Id;
        const data: IBoardFileSource = {
          ...(await serializeEntity(entity)),
          name: entity.name,
          flowId,
          taskStepIds,
        };
        return data;
      },
    );
  }

  public get deserializeBoard() {
    const logging = this.log;
    const deserializeEntity = this.deserializeEntity.bind(this);
    const getTask = this.source.get(EntityType.Task);
    const getFlowOrFail = this.flow.getOrFail;
    const deserializeTaskStepsMap = this.deserializeTaskStepsMap.bind(this);
    return logging.logAsyncOperation('Deserialize Board')(
      async (data: IBoardFileSource): Promise<IBoard & ISaved> => {
        logging.message(data.id);
        const taskIds = Array.from(Object.keys(data.taskStepIds));
        const tasksArr: (ITask & ISaved)[] = await asyncPipe(
          () => taskIds,
          asyncQueuedMap(getTask),
          asyncFilter<(IEntity & ISaved) | undefined, ITask & ISaved>(
            (task) => task !== undefined,
          ),
        )();
        const tasks: Map<Id, ITask & ISaved> = new Map(
          tasksArr.map((task) => [task.id, task]),
        );
        const taskSteps = deserializeTaskStepsMap(data.taskStepIds);
        const flow = await getFlowOrFail(data.flowId);

        const item = {
          ...(await deserializeEntity(data as IEntityFileSource)),
          name: data.name,
          flow,
          tasks,
          taskSteps,
        } as IBoard & ISaved;
        return item;
      },
    );
  }
}

export type TFileSourceSerializingOperators = FileSourceSerializingOperators;

export const FileSourceSerializingOperatorsProvider = (
  context: interfaces.Context,
) => {
  return new FileSourceSerializingOperators(context);
};
