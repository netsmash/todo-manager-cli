import { interfaces } from 'inversify';
import {
  IEntity,
  NotImplementedError,
  Id,
  EntityType,
  ISaved,
  IBoard,
  IEntityOperators,
  IFlow,
  entityIsSaved,
} from 'todo-manager';
import {
  IBoardFileSource,
  IEntityFileSource,
  IFlowFileSource,
  IFlowStepFileSource,
  ITaskFileSource,
} from './models';
import { dirname } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { Identificators } from '../../identificators';
import { Identificators as ModuleIdentificators } from './identificators';
import { CliError } from '../../errors';
import { asyncQueuedMap, createAsyncQueue } from '../../lib';
import type { TYAMLCacheOperators } from './yml-cache';
import type { TFileSourceSerializingOperators } from './serializers';
import type { TYAMLConfigurationOperators } from './configuration';
import type {
  TLoggingOperators,
  TEntityCacheOperators,
  ISourceOperators,
  TSourceProvider,
} from '../../operators';

export class YAMLFileSourceOperators implements ISourceOperators {
  protected configuration: TYAMLConfigurationOperators;
  protected logging: TLoggingOperators;
  protected entityCache: TEntityCacheOperators;
  protected yamlCache: TYAMLCacheOperators;
  protected serializers: TFileSourceSerializingOperators;

  public constructor(protected context: interfaces.Context) {
    this.logging = context.container.get<TLoggingOperators>(
      Identificators.LoggingOperators,
    );
    this.entityCache = context.container.get<TEntityCacheOperators>(
      Identificators.EntityCacheOperators,
    );
    this.configuration = context.container.get<TYAMLConfigurationOperators>(
      ModuleIdentificators.YAMLConfigurationOperators,
    );
    this.yamlCache = context.container.get<TYAMLCacheOperators>(
      ModuleIdentificators.YAMLCacheOperators,
    );
    this.serializers = context.container.get<TFileSourceSerializingOperators>(
      ModuleIdentificators.FileSourceSerializingOperators,
    );
  }

  protected get entities(): IEntityOperators {
    return this.context.container.get<IEntityOperators>(
      Identificators.tm.EntityOperators,
    );

  }

  protected asyncQueue = createAsyncQueue();

  protected get getYAMLFromCache() {
    const readFromCache = this.yamlCache.read.bind(this.yamlCache);
    return async (filePath: string): Promise<any | undefined> => {
      try {
        return await readFromCache(filePath);
      } catch (error) {
        // assume file do not exists
      }
      return undefined;
    };
  }

  protected get setYAMLToCache() {
    const writeToCache = this.yamlCache.write.bind(this.yamlCache);
    return (filePath: string) => async (data: any) => {
      try {
        return await writeToCache(filePath)(data);
      } catch (error) {
        try {
          await mkdir(dirname(filePath), { recursive: true });
          return await writeToCache(filePath)(data);
        } catch (error) {
          throw new CliError(`Unable to write on '${filePath}'.`);
        }
      }
    };
  }

  protected get getFileEntities() {
    const getFilePath = this.configuration.getFilePath.bind(this.configuration);
    const getYAMLFromCache = this.getYAMLFromCache.bind(this);
    return async <EFS extends IEntityFileSource>(
      type: EFS['type'],
    ): Promise<Map<Id, EFS>> => {
      const filePath = await getFilePath(type);
      const data: { [key: Id]: EFS } | undefined = await getYAMLFromCache(
        filePath,
      );
      if (data === undefined) {
        return new Map();
      }
      for (const [id, entry] of Object.entries(data)) {
        entry.id = id;
        entry.type = type;
      }
      return new Map(Object.entries(data));
    };
  }

  protected get setFileEntities() {
    const getFilePath = this.configuration.getFilePath.bind(this.configuration);
    const setYAMLToCache = this.setYAMLToCache.bind(this);
    return <EFS extends IEntityFileSource>(type: EFS['type']) =>
      async (data: Map<Id, EFS>) => {
        const dataCopy: Map<Id, any> = new Map();
        for (const [id, entry] of data) {
          const entryCopy: Partial<EFS> = { ...entry };
          delete entryCopy?.id;
          delete entryCopy?.type;
          dataCopy.set(id, entryCopy);
        }
        const filePath = await getFilePath(type);
        await setYAMLToCache(filePath)(dataCopy);
      };
  }

  protected get getFileEntity() {
    const getFileEntities = this.getFileEntities.bind(this);
    return <EFS extends IEntityFileSource>(type: EFS['type']) =>
      async (id: Id): Promise<EFS | undefined> => {
        const entities = await getFileEntities(type);
        return entities.get(id);
      };
  }

  protected get setFileEntity() {
    const addToQueue = this.asyncQueue.push;
    const getFileEntities = this.getFileEntities.bind(this);
    const setFileEntities = this.setFileEntities.bind(this);
    return <EFS extends IEntityFileSource>(fileEntity: EFS) =>
      addToQueue(async () => {
        const data = await getFileEntities(fileEntity.type);
        data.set(fileEntity.id, fileEntity);
        await setFileEntities(fileEntity.type)(data);
      });
  }

  protected get getNewId() {
    return (): Id => {
      return (
        Math.floor(Math.random() * 256).toString(16) + Date.now().toString(16)
      );
    };
  }

  /**
   * Here starts ISourceOperators interface
   */

  public get get() {
    const logging = this.logging;
    const getFileTask = this.getFileEntity<ITaskFileSource>(
      EntityType.Task,
    ).bind(this);
    const getFileFlowStep = this.getFileEntity<IFlowStepFileSource>(
      EntityType.FlowStep,
    ).bind(this);
    const getFileFlow = this.getFileEntity<IFlowFileSource>(
      EntityType.Flow,
    ).bind(this);
    const getFileBoard = this.getFileEntity<IBoardFileSource>(
      EntityType.Board,
    ).bind(this);
    // use getters to avoid circular dependencies
    const getFromCache = this.entityCache.get.bind(this.entityCache);
    const setIntoCache = this.entityCache.set.bind(this.entityCache);
    const getDeserializeTask = () => this.serializers.deserializeTask;
    const getDeserializeFlowStep = () => this.serializers.deserializeFlowStep;
    const getDeserializeFlow = () => this.serializers.deserializeFlow;
    const getDeserializeBoard = () => this.serializers.deserializeBoard;
    return <E extends IEntity>(type: E['type']) =>
      logging.logAsyncOperation('Source.get()')(
        async (id: Id): Promise<(E & ISaved) | undefined> => {
          const entityOrUndefined = getFromCache<E & ISaved>(id);
          if (entityOrUndefined !== undefined) {
            return entityOrUndefined;
          }
          logging.message(type, id);
          let entity: E & ISaved;
          if (type === EntityType.Task) {
            const data = await getFileTask(id);
            if (data === undefined) {
              return undefined;
            }
            const deserializeTask = getDeserializeTask();
            entity = (await deserializeTask(data)) as E & ISaved;
          } else if (type === EntityType.FlowStep) {
            const data = await getFileFlowStep(id);
            if (data === undefined) {
              return undefined;
            }
            const deserializeFlowStep = getDeserializeFlowStep();
            entity = (await deserializeFlowStep(data)) as E & ISaved;
          } else if (type === EntityType.Flow) {
            const data = await getFileFlow(id);
            if (data === undefined) {
              return undefined;
            }
            const deserializeFlow = getDeserializeFlow();
            entity = (await deserializeFlow(data)) as unknown as E & ISaved;
          } else if (type === EntityType.Board) {
            const data = await getFileBoard(id);
            if (data === undefined) {
              return undefined;
            }
            const deserializeBoard = getDeserializeBoard();
            entity = (await deserializeBoard(data)) as unknown as E & ISaved;
          } else {
            throw new NotImplementedError(
              'YAMLFileSourceOperators.get() pending for implementation',
            );
          }
          setIntoCache(entity);
          return entity;
        },
      );
  }

  public get set(): (entity: IEntity) => Promise<any> {
    const logging = this.logging;
    const ops = { entities: this.entities };
    const getNewId = this.getNewId.bind(this);
    const serialize = this.serializers.serialize.bind(this.serializers);
    const setIntoCache = this.entityCache.set.bind(this.entityCache);
    const getFileEntity = this.getFileEntity.bind(this);
    const setFileEntity = this.setFileEntity.bind(this);
    const set = logging.logAsyncOperation('Source.set()')(
      async (entity: IEntity): Promise<any> => {
        logging.message(entity?.id || 'NEW');
        const savedEntity: IEntity & ISaved = {
          ...ops.entities.clone(entity),
          id: entity.id || getNewId(),
          createdAt: entity.createdAt || new Date(),
        };

        let previousFileBoard: IBoardFileSource | undefined = undefined;
        if (entityIsSaved(entity)) {
          savedEntity.updatedAt = new Date();
          if (entity.type === EntityType.Board) {
            previousFileBoard = await getFileEntity<IBoardFileSource>(
              entity.type,
            )(entity.id);
          }
        }
        const fileEntity = await serialize(savedEntity);
        await setFileEntity(fileEntity);
        setIntoCache(savedEntity);

        // check type for recursive set
        if (entity.type === EntityType.Board) {
          const board = savedEntity as IBoard & ISaved;
          // on tasks, set board as parent board
          for (const task of board.tasks.values()) {
            const data = await getFileEntity<ITaskFileSource>(EntityType.Task)(
              task.id,
            );
            if (data !== undefined) {
              data.boardId = board.id;
              await setFileEntity(data);
            }
          }
          if (previousFileBoard !== undefined) {
            // get removed tasks
            const currentTaskIds = new Set(board.tasks.keys());
            const removedTaskIds = Object.keys(
              previousFileBoard.taskStepIds,
            ).filter((taskId) => !currentTaskIds.has(taskId));

            // on removed tasks, remove this board as parent
            for (const taskId of removedTaskIds) {
              const data = await getFileEntity<ITaskFileSource>(
                EntityType.Task,
              )(taskId);
              if (data !== undefined && data.boardId === board.id) {
                delete data.boardId;
                await setFileEntity(data);
              }
            }
          }
        } else if (entity.type === EntityType.Flow) {
          const flow = entity as IFlow;
          // save flow steps
          await asyncQueuedMap(set)(flow.steps.values());
        }

        return savedEntity;
      },
    );
    return set;
  }

  public get delete() {
    const logging = this.logging;
    const deleteFromCache = this.entityCache.delete.bind(this);
    const getFileEntities = this.getFileEntities.bind(this);
    const setFileEntities = this.setFileEntities.bind(this);
    const getFileEntity = this.getFileEntity.bind(this);
    const setFileEntity = this.setFileEntity.bind(this);
    return (type: EntityType) =>
      logging.logAsyncOperation('Source.delete()')(
        async (id: Id): Promise<void> => {
          logging.message(type, id);
          const data = await getFileEntities(type);
          if (type === EntityType.Task) {
            // remove it from parent's list
            const fileTask: ITaskFileSource | undefined = data.get(id);
            if (fileTask !== undefined && fileTask.boardId) {
              const fileBoard = await getFileEntity<IBoardFileSource>(
                EntityType.Board,
              )(fileTask.boardId);
              if (fileBoard !== undefined) {
                delete fileBoard.taskStepIds[fileTask.id];
                await setFileEntity(fileBoard);
              }
            }
          }
          data.delete(id);
          await setFileEntities(type)(data);
          deleteFromCache(id);
        },
      );
  }

  public get list() {
    const logging = this.logging;
    const getFromCache = this.entityCache.list.bind(this.entityCache);
    const setIntoCache = this.entityCache.setList.bind(this.entityCache);
    const getFileEntities = this.getFileEntities.bind(this);
    const deserialize = this.serializers.deserialize.bind(this.serializers);
    return logging.logAsyncOperation('Source.list()')(
      async <E extends IEntity>(
        type: E['type'],
      ): Promise<Iterable<E & ISaved>> => {
        logging.message(type);
        const maybeEntities = getFromCache(type);
        if (maybeEntities !== undefined) {
          return maybeEntities;
        }
        const fileEntities = (await getFileEntities(type)).values();
        const entities = (await asyncQueuedMap(deserialize)(
          fileEntities,
        )) as (E & ISaved)[];
        setIntoCache(type)(entities);
        return entities;
      },
    );
  }

  public get getTaskBoard() {
    const logging = this.logging;
    const getBoards = () => this.list<IBoard>(EntityType.Board);
    return logging.logAsyncOperation('Source.getTaskBoard()')(
      async (id: Id) => {
        logging.message(id);
        const boards = await getBoards();
        for (const board of boards) {
          if (board.tasks.has(id)) {
            return board;
          }
        }
        return undefined;
      },
    );
  }
}

export const provideYAMLFileSourceOperators: TSourceProvider = (
  context: interfaces.Context,
) => {
  return new YAMLFileSourceOperators(context);
};
