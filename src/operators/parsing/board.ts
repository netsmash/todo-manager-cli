import { inject, injectable } from 'inversify';
import { EntityCollection, entityIsSaved, IBoard, ISaved } from 'todo-manager';
import { Identificators } from '../../identificators';
import { asyncPipe, StringUtils } from '../../lib';
import { TConfigurationOperators } from '../configuration';
import { TColumn } from '../../models';
import { TParserBaseOperators } from './base';
import { TParserTableOperators } from './table';
import { ParsingIdentificators } from './identificators';
import { TBoardOperators, TTaskOperators } from '../todo-manager';
import { TParserFlowOperators } from './flow';

@injectable()
export class ParserBoardOperators {
  protected tm: {
    task: TTaskOperators;
    board: TBoardOperators;
  };
  protected parsers: {
    base: TParserBaseOperators;
    table: TParserTableOperators;
    flow: TParserFlowOperators;
  };
  public constructor(
    @inject(Identificators.ConfigurationOperators)
    protected config: TConfigurationOperators,
    @inject(Identificators.tm.TaskOperators) tmTask: TTaskOperators,
    @inject(Identificators.tm.BoardOperators) tmBoard: TBoardOperators,
    @inject(ParsingIdentificators.Base) pBase: TParserBaseOperators,
    @inject(ParsingIdentificators.Table) pTable: TParserTableOperators,
    @inject(ParsingIdentificators.Flow) pFlow: TParserFlowOperators,
  ) {
    this.tm = {
      task: tmTask,
      board: tmBoard,
    };
    this.parsers = {
      base: pBase,
      table: pTable,
      flow: pFlow,
    };
  }

  public get tableColumns(): Iterable<TColumn<IBoard & ISaved>> {
    const parseId = this.parsers.base.parseId.bind(this.parsers.base);
    const parseFlow = this.parsers.flow.parseForBoard.bind(this.parsers.flow);
    const parseEntityDate = this.parsers.base.parseEntityDate.bind(
      this.parsers.base,
    );
    const parseName = this.parsers.base.parseName.bind(this.parsers.base);
    return [
      [{ shrinkable: true, shrinkableMin: 13 }, parseId],
      [{}, parseFlow],
      [
        {},
        ({ width = 4, align = 'right' } = {}) =>
          (board) => {
            let result = `${board.tasks.size}`;
            if (width !== undefined) {
              result = StringUtils.align(width, align)(result);
            }
            return result;
          },
      ],
      [{ shrinkable: true, shrinkableMin: 5, shrinkStr: '...' }, parseName],
      [{ shrinkable: true, shrinkStr: '...' }, parseEntityDate],
    ];
  }

  public get tableOptions() {
    return {
      width: process.stdout.columns,
      gap: 1,
      gapFillStr: ' ',
    };
  }

  public get getTableParser() {
    const getTableParser = this.parsers.table.parseTable.bind(
      this.parsers.table,
    );
    const tableOptions = this.tableOptions;
    const tableColumns = this.tableColumns;
    return (entitiesToMeasure: Iterable<IBoard & ISaved>) => {
      return getTableParser(tableOptions)(tableColumns)(entitiesToMeasure);
    };
  }

  public get getTableWidth() {
    const getTableWidth = this.parsers.table.getTableWidth.bind(
      this.parsers.table,
    );
    const tableOptions = this.tableOptions;
    const tableColumns = this.tableColumns;
    return (entitiesToMeasure: Iterable<IBoard & ISaved>) => {
      return getTableWidth(tableOptions)(tableColumns)(entitiesToMeasure);
    };
  }

  public get table() {
    const getTableParser = this.getTableParser.bind(this);
    return async (entities: Iterable<IBoard & ISaved>) => {
      return await getTableParser(entities)(entities);
    };
  }

  public get collection() {
    const getTableParser = this.getTableParser.bind(this);
    return async (collection: EntityCollection<IBoard & ISaved>) => {
      const boards = await asyncPipe(
        () => collection.values(),
        (it) => Array.from(it),
      )();

      if (boards.length === 0) {
        return '';
      }

      // parse
      const parseTable = getTableParser(boards);
      return await parseTable(boards);
    };
  }

  public get detail() {
    const setColor = this.parsers.base.setColor.bind(this.parsers.base);
    const parseFlow = this.parsers.flow.parseForBoard.bind(this.parsers.flow);
    const parseId = this.parsers.base.parseId.bind(this.parsers.base);
    const parseExactEntityDate = this.parsers.base.parseExactEntityDate.bind(
      this.parsers.base,
    );
    return async (board: IBoard) => {
      let result = '';

      if (entityIsSaved(board)) {
        const flowStr = await parseFlow()(board);
        const idStr = await parseId({ color: 'blueBright' })(board);
        const dateStr = await parseExactEntityDate({ color: 'blueBright' })(
          board,
        );
        result += `${idStr} ${flowStr} ${dateStr}`.trim();
        result += `\n${setColor(`whiteBright`)(board.name.trim())}`;
      } else {
        result += `${board.name}`;
        result += `\n\nNot saved yet`;
      }

      if (board.description !== undefined) {
        result += `\n\n${board.description}`;
      }
      return result;
    };
  }
}

export type TParserBoardOperators = ParserBoardOperators;
