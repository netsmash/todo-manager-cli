// source: https://stackoverflow.com/questions/60135993/typescript-how-to-write-an-asyncpipe-function-for-asynchronous-function-composi

// get to the promise resolved type
type Sync<T> = T extends Promise<infer I> ? I : T;

/*
// Transform a D to a promise, if any of the others A,B, or C is a promise
type RelayPromise<A, B, C, D> =
    A extends Promise<any> ? Promise<Sync<D>> :
    B extends Promise<any> ? Promise<Sync<D>> :
    C extends Promise<any> ? Promise<Sync<D>> : D
*/
/*
export function asyncPipe<A, B, C>(
  ab: (a: A) => B,
  bc: (b: Sync<B>) => C
): < D extends A | Promise<A>>(a: D) => RelayPromise<B, C, D, C>
*/

type FM<A extends any[], B> = (...args: A) => B;
type FO<A, B> = (a: A) => B;

export function asyncPipe<A extends any[], B>(ab: FM<A, B>): FM<A, B>;
export function asyncPipe<A extends any[], B, C>(
  ab: FM<A, B>,
  bc: FO<Sync<B>, C>,
): FM<A, Promise<Sync<C>>>;
export function asyncPipe<A extends any[], B, C, D>(
  ab: FM<A, B>,
  bc: FO<Sync<B>, C>,
  cd: FO<Sync<C>, D>,
): FM<A, Promise<Sync<D>>>;
export function asyncPipe<A extends any[], B, C, D, E>(
  ab: FM<A, B>,
  bc: FO<Sync<B>, C>,
  cd: FO<Sync<C>, D>,
  de: FO<Sync<D>, E>,
): FM<A, Promise<Sync<E>>>;
export function asyncPipe<A extends any[], B, C, D, E, F>(
  ab: FM<A, B>,
  bc: FO<Sync<B>, C>,
  cd: FO<Sync<C>, D>,
  de: FO<Sync<D>, E>,
  ef: FO<Sync<E>, F>,
): FM<A, Promise<Sync<F>>>;
export function asyncPipe<A extends any[], B, C, D, E, F, G>(
  ab: FM<A, B>,
  bc: FO<Sync<B>, C>,
  cd: FO<Sync<C>, D>,
  de: FO<Sync<D>, E>,
  ef: FO<Sync<E>, F>,
  fg: FO<Sync<F>, G>,
): FM<A, Promise<Sync<G>>>;
export function asyncPipe<A extends any[], B, C, D, E, F, G, H>(
  ab: FM<A, B>,
  bc: FO<Sync<B>, C>,
  cd: FO<Sync<C>, D>,
  de: FO<Sync<D>, E>,
  ef: FO<Sync<E>, F>,
  fg: FO<Sync<F>, G>,
  gh: FO<Sync<G>, H>,
): FM<A, Promise<Sync<H>>>;
export function asyncPipe<A extends any[], B, C, D, E, F, G, H, I>(
  ab: FM<A, B>,
  bc: FO<Sync<B>, C>,
  cd: FO<Sync<C>, D>,
  de: FO<Sync<D>, E>,
  ef: FO<Sync<E>, F>,
  fg: FO<Sync<F>, G>,
  gh: FO<Sync<G>, H>,
  hi: FO<Sync<H>, I>,
): FM<A, Promise<Sync<I>>>;
export function asyncPipe<A extends any[], B, C, D, E, F, G, H, I, J>(
  ab: FM<A, B>,
  bc: FO<Sync<B>, C>,
  cd: FO<Sync<C>, D>,
  de: FO<Sync<D>, E>,
  ef: FO<Sync<E>, F>,
  fg: FO<Sync<F>, G>,
  gh: FO<Sync<G>, H>,
  hi: FO<Sync<H>, I>,
  ij: FO<Sync<I>, J>,
): FM<A, Promise<Sync<J>>>;
export function asyncPipe<A extends any[], B, C, D, E, F, G, H, I, J, K>(
  ab: FM<A, B>,
  bc: FO<Sync<B>, C>,
  cd: FO<Sync<C>, D>,
  de: FO<Sync<D>, E>,
  ef: FO<Sync<E>, F>,
  fg: FO<Sync<F>, G>,
  gh: FO<Sync<G>, H>,
  hi: FO<Sync<H>, I>,
  ij: FO<Sync<I>, J>,
  jK: FO<Sync<J>, K>,
): FM<A, Promise<Sync<K>>>;
export function asyncPipe<A extends any[], B, C, D, E, F, G, H, I, J, K, L>(
  ab: FM<A, B>,
  bc: FO<Sync<B>, C>,
  cd: FO<Sync<C>, D>,
  de: FO<Sync<D>, E>,
  ef: FO<Sync<E>, F>,
  fg: FO<Sync<F>, G>,
  gh: FO<Sync<G>, H>,
  hi: FO<Sync<H>, I>,
  ij: FO<Sync<I>, J>,
  jk: FO<Sync<J>, K>,
  kl: FO<Sync<K>, L>,
): FM<A, Promise<Sync<L>>>;
export function asyncPipe<A extends any[], B, C, D, E, F, G, H, I, J, K, L, M>(
  ab: FM<A, B>,
  bc: FO<Sync<B>, C>,
  cd: FO<Sync<C>, D>,
  de: FO<Sync<D>, E>,
  ef: FO<Sync<E>, F>,
  fg: FO<Sync<F>, G>,
  gh: FO<Sync<G>, H>,
  hi: FO<Sync<H>, I>,
  ij: FO<Sync<I>, J>,
  jk: FO<Sync<J>, K>,
  kl: FO<Sync<K>, L>,
  lm: FO<Sync<L>, M>,
): FM<A, Promise<Sync<M>>>;
export function asyncPipe(...fns: Function[]) {
  return (x: any) =>
    fns.reduce((y, fn) => {
      return y instanceof Promise ? y.then((yr) => fn(yr)) : fn(y);
    }, x);
}
