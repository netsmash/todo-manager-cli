import { interfaces } from 'inversify';
import {
  IBoard,
  Id,
  IEntity,
  ISaved,
  MaybePromise,
  ISourceOperators as ISourceOperatorsBase,
} from 'todo-manager';

export interface ISourceOperators extends ISourceOperatorsBase {
  // optional
  list: <E extends IEntity>(
    type: E['type'],
  ) => MaybePromise<Iterable<E & ISaved>>;
  getTaskBoard: (id: Id) => MaybePromise<(IBoard & ISaved) | undefined>;
}

export type TSourceProvider = (context: interfaces.Context) => ISourceOperators;
