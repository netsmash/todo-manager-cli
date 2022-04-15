export type asyncSort = <T>(
  compare: (a: T, b: T) => Promise<number>,
) => (arr: T[]) => Promise<T[]>;
export const asyncSort =
  <T>(compare: (a: T, b: T) => Promise<number>) =>
  async (arr: T[]): Promise<T[]> => {
    const newArr = arr.slice();
    const swap = (i: number, j: number) => {
      const c = newArr[i] as T;
      newArr[i] = newArr[j] as T;
      newArr[j] = c;
    };
    for (let i = 0; i < newArr.length; i++) {
      for (let j = i + 1; j < newArr.length; j++) {
        const comparison = await compare(newArr[i] as T, newArr[j] as T);
        if (comparison > 0) {
          swap(i, j);
        }
      }
    }
    return newArr;
  };
