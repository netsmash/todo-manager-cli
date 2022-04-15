import { MaybePromise } from 'todo-manager';
import { createAsyncQueue } from './async-queue';

type Callback<T, R> = (
  currentValue: T,
  index: number,
  array: T[],
) => MaybePromise<R>;

export const asyncMap =
  <T, R>(fn: Callback<T, R>) =>
  (it: Iterable<T>) =>
    Promise.all(Array.from(it).map(fn));

export const asyncQueuedMap =
  <T, R>(fn: Callback<T, R>) =>
  (it: Iterable<T>): Promise<R[]> => {
    const { push, getLastPromise } = createAsyncQueue();
    const arr = Array.from(it);
    arr
      .map(
        (currentValue, index, arr) => async () => fn(currentValue, index, arr),
      )
      .forEach((asyncTask) => push<R>(asyncTask));
    return getLastPromise() as Promise<R[]>;
  };

/*
export const asyncMap = <T, R>(fn: Callback<T, R>) =>
  async (it: Iterable<T>) => {
    const arr: T[] = Array.from(it);
    const result: R[] = [];
    for (const [i, value] of arr.entries()) {
      result.push(await fn(value, i, arr));
    }
    return result;
  };
*/
