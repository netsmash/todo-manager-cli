import { interfaces } from 'inversify';
import {
  IEntity,
  NotImplementedError,
  Id,
  EntityType,
  ISaved,
  TSourceProvider,
} from 'todo-manager';
import type { ISourceOperators } from './interfaces';

export class DummySourceOperators implements ISourceOperators {
  public constructor(_: interfaces.Context) {}
  /**
   * Here starts ISourceOperators interface
   */

  public get get() {
    return <E extends IEntity>(_: E['type']) =>
      async (_: Id): Promise<(E & ISaved) | undefined> => {
        throw new NotImplementedError('SourceOperators not implemented');
      };
  }

  public get set(): (entity: IEntity) => Promise<any> {
    return async (_: IEntity): Promise<any> => {
      throw new NotImplementedError('SourceOperators not implemented');
    };
  }

  public get delete() {
    return (_: EntityType) =>
      async (_: Id): Promise<void> => {
        throw new NotImplementedError('SourceOperators not implemented');
      };
  }

  public get list() {
    return async <E extends IEntity>(
      _: E['type'],
    ): Promise<Iterable<E & ISaved>> => {
      throw new NotImplementedError('SourceOperators not implemented');
    };
  }

  public get getTaskBoard() {
    return async (_: Id) => {
      throw new NotImplementedError('SourceOperators not implemented');
    };
  }
}

export const provideDummySourceOperators: TSourceProvider = (
  context: interfaces.Context,
) => {
  return new DummySourceOperators(context);
};
