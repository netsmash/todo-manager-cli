import { inject, injectable } from 'inversify';
import {
  EntityCollection,
  entityIsSaved,
  IBoard,
  ISaved,
  ITask,
} from 'todo-manager';
import { Identificators } from '../../identificators';
import { asyncPipe, StringUtils } from '../../lib';
import { TConfigurationOperators } from '../configuration';
import { TColumn, TItemParser } from '../../models';
import { TParserBaseOperators } from './base';
import { TParserTableOperators } from './table';
import { ParsingIdentificators } from './identificators';
import { TBoardOperators, TTaskOperators } from '../todo-manager';
import { TParserFlowStepOperators } from './flow-step';
import { TParserCacheOperators } from './cache';
import { TLoggingOperators } from '../logging';

@injectable()
export class ParserTaskOperators {
  protected tm: {
    task: TTaskOperators;
    board: TBoardOperators;
  };
  protected parsers: {
    base: TParserBaseOperators;
    cache: TParserCacheOperators;
    table: TParserTableOperators;
    flowStep: TParserFlowStepOperators;
  };
  public constructor(
    @inject(Identificators.ConfigurationOperators)
    protected config: TConfigurationOperators,
    @inject(Identificators.LoggingOperators)
    protected logging: TLoggingOperators,
    @inject(Identificators.tm.TaskOperators) tmTask: TTaskOperators,
    @inject(Identificators.tm.BoardOperators) tmBoard: TBoardOperators,
    @inject(ParsingIdentificators.Base) pBase: TParserBaseOperators,
    @inject(ParsingIdentificators.Cache) pCache: TParserCacheOperators,
    @inject(ParsingIdentificators.Table) pTable: TParserTableOperators,
    @inject(ParsingIdentificators.FlowStep) pFlowStep: TParserFlowStepOperators,
  ) {
    this.tm = {
      task: tmTask,
      board: tmBoard,
    };
    this.parsers = {
      base: pBase,
      cache: pCache,
      table: pTable,
      flowStep: pFlowStep,
    };
  }

  public get tableColumns(): Iterable<TColumn<ITask & ISaved>> {
    const parseId = this.parsers.base.parseId.bind(this.parsers.base);
    const parseEntityDate = this.parsers.base.parseEntityDate.bind(
      this.parsers.base,
    );
    const parseFlowStep = this.parsers.flowStep.parseForTask.bind(
      this.parsers.flowStep,
    );
    const parseName = this.parsers.base.parseName.bind(this.parsers.base);
    return [
      [{ shrinkable: true, shrinkableMin: 13 }, parseId],
      [{}, parseFlowStep],
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
    const logging = this.logging;
    const getTableParser = this.parsers.table.parseTable.bind(
      this.parsers.table,
    );
    const tableOptions = this.tableOptions;
    const tableColumns = this.tableColumns;
    return logging.logOperation('ParserTask.getTableParser()')(
      (entitiesToMeasure: Iterable<ITask & ISaved>) => {
        return getTableParser(tableOptions)(tableColumns)(entitiesToMeasure);
      },
    );
  }

  public get getTableWidth() {
    const logging = this.logging;
    const getTableWidth = this.parsers.table.getTableWidth.bind(
      this.parsers.table,
    );
    const tableOptions = this.tableOptions;
    const tableColumns = this.tableColumns;
    return logging.logAsyncOperation('ParserTask.getTableWidth()')(
      async (entitiesToMeasure: Iterable<ITask & ISaved>) => {
        return await getTableWidth(tableOptions)(tableColumns)(
          entitiesToMeasure,
        );
      },
    );
  }

  public get table() {
    const logging = this.logging;
    const getTableParser = this.getTableParser.bind(this);
    return logging.logAsyncOperation('ParserTask.table()')(
      async (entities: Iterable<ITask & ISaved>) => {
        return await getTableParser(entities)(entities);
      },
    );
  }

  public get parseHeader(): TItemParser<IBoard | undefined> {
    const isColorAllowed = this.parsers.base.isColorAllowed.bind(
      this.parsers.base,
    );
    const setColor = this.parsers.base.setColor.bind(this.parsers.base);
    const getLengthOf = this.parsers.base.lengthOf.bind(this.parsers.base);
    const parseId = this.parsers.base.parseId.bind(this.parsers.base);
    const parseName = this.parsers.base.parseName.bind(this.parsers.base);
    const hrColor = 'white';
    const hrChar = '─';
    return ({ width = 0, ...ops } = {}) =>
      async (board) => {
        let result = ``;
        if (board === undefined) {
          result = StringUtils.fill(width, hrChar);
          if (await isColorAllowed(ops.allowColor)) {
            result = setColor(hrColor)(result);
          }
        } else {
          if (entityIsSaved(board)) {
            const idLength = await getLengthOf(parseId)(ops)(board);
            width -= idLength + 1;
            result += (await parseId(ops)(board)) + ` `;
          }
          const nameLength = await getLengthOf(parseName)(ops)(board);
          width -= nameLength + 2;
          const nameStr = await parseName(ops)(board);
          const leftHrLength = Math.floor(width / 2);
          let leftHrStr = StringUtils.repeatUntilLength(hrChar)(leftHrLength);
          const rightHrLength = width - leftHrLength;
          let rightHrStr = StringUtils.repeatUntilLength(hrChar)(rightHrLength);
          if (await isColorAllowed(ops.allowColor)) {
            leftHrStr = setColor(hrColor)(leftHrStr);
            rightHrStr = setColor(hrColor)(rightHrStr);
          }
          result += `${leftHrStr} ${nameStr} ${rightHrStr}`;
        }
        return result;
      };
  }

  public get collection() {
    const logging = this.logging;
    const getTableParser = this.getTableParser.bind(this);
    const getTableWidth = this.getTableWidth.bind(this);
    const taskSort = this.tm.task.asyncSort.bind(this.tm.task);
    const getTaskBoard = this.parsers.cache.getTaskBoard.bind(
      this.parsers.cache,
    );
    const clearCache = this.parsers.cache.clear.bind(this.parsers.cache);
    const parseHearder = this.parseHeader.bind(this);
    return logging.logAsyncOperation('ParserTask.collection()')(
      async (collection: EntityCollection<ITask & ISaved>) => {
        logging.message('Clear cache');
        clearCache();
        logging.message('Get and sort');
        const tasks = await asyncPipe(
          () => collection.values(),
          (it) => Array.from(it),
          taskSort,
        )();

        if (tasks.length === 0) {
          return '';
        }

        // parse
        logging.message('Parsing');
        const parseTable = getTableParser(tasks);
        const tableWidth = await getTableWidth(tasks);
        const lines: string[] = [];

        logging.message('Parse by boards');
        let currentTask = tasks[0] as ITask & ISaved;
        let currentBoard = (await getTaskBoard(currentTask)) as
          | (IBoard & ISaved)
          | undefined;
        const changingIndexes: number[] = [0];
        const boards: ((IBoard & ISaved) | undefined)[] = [currentBoard];
        for (let i = 1; i < tasks.length; i++) {
          const task = tasks[i] as ITask & ISaved;
          const board = (await getTaskBoard(task)) as
            | (IBoard & ISaved)
            | undefined;
          if (board?.id !== currentBoard?.id) {
            changingIndexes.push(i);
            boards.push(board);
            currentBoard = board;
          }
        }
        changingIndexes.push(tasks.length);
        for (const [i, board] of boards.entries()) {
          const from = changingIndexes[i];
          const to = changingIndexes[i + 1];
          const header = await parseHearder({ width: tableWidth })(board);
          if (i > 0) {
            lines.push('');
          }
          lines.push(header);
          lines.push(await parseTable(tasks.slice(from, to)));
        }
        return lines.join(`\n`);
      },
    );
  }

  public get detail() {
    const parseFlowStep = this.parsers.flowStep.parseForTask.bind(
      this.parsers.flowStep,
    );
    const parseId = this.parsers.base.parseId.bind(this.parsers.base);
    const parseEntityDate = this.parsers.base.parseEntityDate.bind(
      this.parsers.base,
    );
    const parseName = this.parsers.base.parseName.bind(this.parsers.base);
    const getTaskBoard = this.parsers.cache.getTaskBoard.bind(
      this.parsers.cache,
    );
    const clearCache = this.parsers.cache.clear.bind(this.parsers.cache);
    return async (task: ITask) => {
      clearCache();
      let result = '';

      if (entityIsSaved(task)) {
        const flowStepStr = await parseFlowStep()(task);
        result += `${flowStepStr} ${task.name}`.trim();
        const idStr = await parseId()(task);
        const dateStr = await parseEntityDate()(task);
        result += `\n\n${idStr} ${dateStr}`;
        const board = await getTaskBoard(task);
        if (board === undefined) {
          result += `\nThis task is orphan`;
        } else {
          const boardNameStr = await parseName()(board);
          result += `\nBoard: ${boardNameStr}`;
        }
      } else {
        result += `${task.name}`;
        result += `\n\nNot saved yet`;
      }

      if (task.description !== undefined) {
        result += `\n\n${task.description}`;
      }
      return result;
    };
  }
}

export type TParserTaskOperators = ParserTaskOperators;
