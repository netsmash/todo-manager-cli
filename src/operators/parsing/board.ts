import { inject, injectable } from 'inversify';
import {
  EntityCollection,
  entityIsSaved,
  IBoard,
  Id,
  IFlowStep,
  ISaved,
} from 'todo-manager';
import { Identificators } from '../../identificators';
import { asyncPipe, StringUtils } from '../../lib';
import { TConfigurationOperators } from '../configuration';
import { ITableParserOptions, TColumn } from '../../models';
import { TParserBaseOperators } from './base';
import { TParserTableOperators } from './table';
import { ParsingIdentificators } from './identificators';
import { TBoardOperators, TTaskOperators } from '../todo-manager';
import { TParserFlowOperators } from './flow';
import { TParserFlowStepOperators } from './flow-step';

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
    flowStep: TParserFlowStepOperators;
  };
  public constructor(
    @inject(Identificators.ConfigurationOperators)
    protected config: TConfigurationOperators,
    @inject(Identificators.tm.TaskOperators) tmTask: TTaskOperators,
    @inject(Identificators.tm.BoardOperators) tmBoard: TBoardOperators,
    @inject(ParsingIdentificators.Base) pBase: TParserBaseOperators,
    @inject(ParsingIdentificators.Table) pTable: TParserTableOperators,
    @inject(ParsingIdentificators.Flow) pFlow: TParserFlowOperators,
    @inject(ParsingIdentificators.FlowStep) pFlowStep: TParserFlowStepOperators,
  ) {
    this.tm = {
      task: tmTask,
      board: tmBoard,
    };
    this.parsers = {
      base: pBase,
      table: pTable,
      flow: pFlow,
      flowStep: pFlowStep,
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

  public get tasksByStepsTable() {
    const hrChar = '─';
    const fillChar = '■';
    const parseTable = this.parsers.table.parseTable.bind(this.parsers.table);
    const parseFlowStep = this.parsers.flowStep.parseName.bind(
      this.parsers.flowStep,
    );
    return async (board: IBoard & ISaved) => {
      // Define table options
      const tableOptions: ITableParserOptions = {
        width: process.stdout.columns,
        gap: 1,
        gapFillStr: ' ',
      };

      // Define table data
      const flow = board.flow;
      const numTasksByStep: Map<Id, number> = new Map();
      board.taskSteps.forEach((flowStepId) => {
        const current = numTasksByStep.get(flowStepId) || 0;
        numTasksByStep.set(flowStepId, current + 1);
      });

      const data: Iterable<T> = flow.order.map((flowStepId) => {
        return [
          flow.steps.get(flowStepId) as IFlowStep & ISaved,
          numTasksByStep.get(flowStepId) || 0,
        ];
      });

      // Define table structure
      type T = [IFlowStep, number];

      const columns: Iterable<TColumn<T>> = [
        [
          {},
          (ops) =>
            async ([flowStep]) =>
              await parseFlowStep(ops)(flowStep),
        ],
        [
          {},
          ({width} = {}) =>
            async ([_, x]) => width
              ? StringUtils.align(width, "right")(String(x))
              : String(x),
        ],
        [
          {},
          () =>
            async ([_, x]) => {
              const n = board.tasks.size;
              const N = 10;
              const Np = Math.floor((x * N) / n);
              const filledBar = StringUtils.repeatUntilLength(fillChar)(Np);
              const emptyBar = StringUtils.repeatUntilLength(hrChar)(N - Np);
              return `[${filledBar}${emptyBar}]`;
            },
        ],
        [
          {},
          ({ width } = {}) =>
            async ([_, x]) => {
              const p = (100 * x) / board.tasks.size;
              let result = `${p.toFixed(2)} %`;
              if (width !== undefined) {
                result = StringUtils.align(width, 'right')(result);
              }
              return result;
            },
        ],
      ];

      // Parse table
      return await parseTable(tableOptions)(columns)(data)(data);
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
    const parseNumTaskByStepsTable = this.tasksByStepsTable.bind(this);
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

      if (!entityIsSaved(board)) {
        // Do nothing
      } else if (board.tasks.size > 0) {
        const numTasksByStepTable = await parseNumTaskByStepsTable(board);
        result +=
          `\n\nThis board has ${setColor('blueBright')(
            String(board.tasks.size),
          )}` + ` associated tasks in the following distribution:`;
        result += `\n\n${numTasksByStepTable}`;
      } else {
        result += `\n\nThis board has not associated tasks.`;
      }

      return result;
    };
  }
}

export type TParserBoardOperators = ParserBoardOperators;
