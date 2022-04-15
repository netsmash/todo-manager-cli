export type AsyncTask<R> = () => Promise<R>;

export interface AsyncQueue {
  push: <R>(asyncTask: AsyncTask<R>) => Promise<R>;
}

export const createAsyncQueue = () => {
  let currentPromise = Promise.resolve();
  const results: unknown[] = [];
  const push = <R>(asyncTask: AsyncTask<R>): Promise<R> => {
    let resolve: (r: R) => void = () => {};
    let reject: (error: any) => void = () => {};

    const promise = new Promise<R>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    currentPromise = currentPromise
      .then(asyncTask)
      .then((value: R) => {
        results.push(value);
        return value;
      })
      .then(resolve)
      .catch(reject);

    return promise;
  };
  const getLastPromise = () => currentPromise.then((_) => results);

  return { push, getLastPromise };
};
