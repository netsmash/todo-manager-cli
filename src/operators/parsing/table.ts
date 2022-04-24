import { inject, injectable } from 'inversify';
import { asyncMap, asyncPipe, asyncQueuedMap, StringUtils } from '../../lib';
import {
  ITableParserOptions,
  TColumn,
  TTableParser,
  TWidthColumnParser,
} from '../../models';
import { Identificators } from '../../identificators';
import { CliError } from '../../errors';
import { TConfigurationOperators } from '../configuration';
import { TParserBaseOperators } from './base';
import { ParsingIdentificators } from './identificators';
import { TLoggingOperators } from '../logging';

@injectable()
export class ParserTableOperators {
  public constructor(
    @inject(Identificators.ConfigurationOperators)
    protected config: TConfigurationOperators,
    @inject(Identificators.LoggingOperators)
    protected logging: TLoggingOperators,
    @inject(ParsingIdentificators.Base)
    protected base: TParserBaseOperators,
  ) {}

  public get getColumnWidth() {
    const logging = this.logging;
    const getMaxLength = this.base.getMaxLength.bind(this.base);
    return <T extends any = any>([
      options,
      fn,
    ]: TColumn<T>): TWidthColumnParser<T> =>
      logging.logAsyncOperation('ParserTable.getColumnWidth()')(
        getMaxLength(fn)(options),
      );
  }

  public get parseTable(): TTableParser {
    const logging = this.logging;
    const getColumnWidth = this.getColumnWidth.bind(this);
    const getConfiguration = this.config.getConfiguration.bind(this.config);
    return <T extends any = any>(tableOptions: ITableParserOptions = {}) =>
      (_columns: Iterable<TColumn<T>>) =>
      (_valuesToMeasure: Iterable<T>) =>
        logging.logAsyncOperation('ParserTable.parseTable()')(
          async (_values: Iterable<T>) => {
            const configuration = await getConfiguration();
            const width: number = tableOptions?.width || process.stdout.columns;
            const gap: number = tableOptions?.gap || 1;
            const gapFillStr: string = tableOptions.gapFillStr || ' ';
            const columns: TColumn<T>[] = Array.from(_columns);
            const values: T[] = Array.from(_values);
            const valuesToMeasure: T[] = Array.from(_valuesToMeasure);
            const columnWidths: number[] = await asyncPipe(
              asyncQueuedMap(getColumnWidth),
              asyncQueuedMap((fn: TWidthColumnParser<T>) =>
                fn(valuesToMeasure),
              ),
            )(columns);
            const computedWidth =
              columnWidths.reduce((a, b) => a + b, 0) +
              gap * (columns.length - 1);

            if (!configuration.view.fitToOutputWidth) {
              // Do nothing
            } else if (width < computedWidth) {
              throw new CliError('Table does not fit into the output.');
            }

            const rows = await asyncMap<T, string>(async (value) => {
              const cols = await asyncMap<TColumn<T>, string>(
                ([options, itemParser], i) =>
                  itemParser({ ...options, width: columnWidths[i] })(value),
              )(columns);
              return cols.join(StringUtils.repeatUntilLength(gapFillStr)(gap));
            })(values);
            return rows.join(`\n`);
          },
        );
  }

  public get getTableWidth() {
    const logging = this.logging;
    const getColumnWidth = this.getColumnWidth.bind(this);
    return <T extends any = any>(tableOptions: ITableParserOptions = {}) =>
      (_columns: Iterable<TColumn<T>>) =>
        logging.logAsyncOperation('ParserTable.getTableWidth()')(
          async (_valuesToMeasure: Iterable<T>): Promise<number> => {
            const gap: number = tableOptions?.gap || 1;
            const columns: TColumn<T>[] = Array.from(_columns);
            const valuesToMeasure: T[] = Array.from(_valuesToMeasure);
            const columnWidths: number[] = await asyncPipe(
              asyncQueuedMap(getColumnWidth),
              asyncQueuedMap((fn: TWidthColumnParser<T>) =>
                fn(valuesToMeasure),
              ),
            )(columns);
            const computedWidth =
              columnWidths.reduce((a, b) => a + b, 0) +
              gap * (columns.length - 1);
            return computedWidth;
          },
        );
  }
}

export type TParserTableOperators = ParserTableOperators;
