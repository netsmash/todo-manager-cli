import { MaybePromise } from 'todo-manager';

type BooleanCallback<T> = (
  currentValue: T,
  index: number,
  array: T[],
) => MaybePromise<boolean>;

export const asyncFilter = <T, R extends T = T>(fn: BooleanCallback<T>) => {
  return async (it: Iterable<T>): Promise<R[]> => {
    const arr = Array.from(it);
    const newArr: R[] = [];
    for (const [i, value] of arr.entries()) {
      if (await fn(value, i, arr)) {
        newArr.push(value as R);
      }
    }
    return newArr;
  };
};
