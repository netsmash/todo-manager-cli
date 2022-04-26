import { MaybePromise, TFlowStepColor } from 'todo-manager';

export interface IItemParserOptions {
  width?: number;
  align?: 'left' | 'center' | 'right';
  allowColor?: boolean;
  color?: TFlowStepColor;
  shrinkable?: boolean;
  shrinkableMin?: number;
  shrinkStr?: string;
}

export interface ITableParserOptions {
  width?: number;
  align?: 'left' | 'center' | 'right';
  gap?: number;
  gapFillStr?: string;
}

export type TFixedItemParser<T extends any = any> = (
  item: T,
) => MaybePromise<string>;
export type TItemParser<T extends any = any> = (
  options?: IItemParserOptions,
) => TFixedItemParser<T>;
export type TLenItemParser<T extends any = any> = (
  options?: IItemParserOptions,
) => (item: T) => MaybePromise<number>;
export type TColumn<T extends any = any> = [IItemParserOptions, TItemParser<T>];
export type TWidthColumnParser<T extends any = any> = (
  items: Iterable<T>,
) => MaybePromise<number>;
export type TTableParser<T extends any = any> = (
  options?: ITableParserOptions,
) => (
  columns: Iterable<TColumn<T>>,
) => (valuesToMeasure: Iterable<T>) => TFixedItemParser<Iterable<T>>;
