import { MaybePromise } from 'todo-manager';

type Operation<T, R> = (value: T) => MaybePromise<R>;

export const asyncTap =
  <T>(fn: Operation<T, any | void>): Operation<T, T> =>
  async (value: T): Promise<T> => {
    await fn(value);
    return value;
  };
