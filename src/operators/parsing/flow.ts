import { inject, injectable } from 'inversify';
import {
  EntityCollection,
  entityIsSaved,
  IBoard,
  IFlow,
  ISaved,
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
import { TParserTaskOperators } from './task';

@injectable()
export class ParserFlowOperators {
  protected tm: {
    task: TTaskOperators;
    board: TBoardOperators;
  };
  protected parsers: {
    base: TParserBaseOperators;
    table: TParserTableOperators;
    task: TParserTaskOperators;
    flowStep: TParserFlowStepOperators;
  };
  public constructor(
    @inject(Identificators.ConfigurationOperators)
    protected config: TConfigurationOperators,
    @inject(Identificators.tm.TaskOperators) tmTask: TTaskOperators,
    @inject(Identificators.tm.BoardOperators) tmBoard: TBoardOperators,
    @inject(ParsingIdentificators.Base) pBase: TParserBaseOperators,
    @inject(ParsingIdentificators.Table) pTable: TParserTableOperators,
    @inject(ParsingIdentificators.Task) pTask: TParserTaskOperators,
    @inject(ParsingIdentificators.FlowStep) pFlowStep: TParserFlowStepOperators,
  ) {
    this.tm = {
      task: tmTask,
      board: tmBoard,
    };
    this.parsers = {
      base: pBase,
      table: pTable,
      task: pTask,
      flowStep: pFlowStep,
    };
  }

  public get tableColumns(): Iterable<TColumn<IFlow & ISaved>> {
    const parseFlowStep = this.parsers.flowStep.parseName.bind(
      this.parsers.flowStep,
    );
    const parseId = this.parsers.base.parseId.bind(this.parsers.base);
    const parseEntityDate = this.parsers.base.parseEntityDate.bind(
      this.parsers.base,
    );
    const parseName = this.parsers.base.parseName.bind(this.parsers.base);
    return [
      [{ shrinkable: true, shrinkableMin: 13 }, parseId],
      [
        {},
        ({ width = 4, align = 'right' } = {}) =>
          (flow) => {
            let result = `${flow.steps.size}`;
            if (width !== undefined) {
              result = StringUtils.align(width, align)(result);
            }
            return result;
          },
      ],
      [
        {},
        (opts) => async (flow) => {
          const flowStep =
            flow.defaultStepId === undefined
              ? undefined
              : flow.steps.get(flow.defaultStepId);
          return await parseFlowStep(opts)(flowStep);
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
    return (entitiesToMeasure: Iterable<IFlow & ISaved>) => {
      return getTableParser(tableOptions)(tableColumns)(entitiesToMeasure);
    };
  }

  public get getTableWidth() {
    const getTableWidth = this.parsers.table.getTableWidth.bind(
      this.parsers.table,
    );
    const tableOptions = this.tableOptions;
    const tableColumns = this.tableColumns;
    return (entitiesToMeasure: Iterable<IFlow & ISaved>) => {
      return getTableWidth(tableOptions)(tableColumns)(entitiesToMeasure);
    };
  }

  public get table() {
    const getTableParser = this.getTableParser.bind(this);
    return async (entities: Iterable<IFlow & ISaved>) => {
      return await getTableParser(entities)(entities);
    };
  }

  public get collection() {
    const getTableParser = this.getTableParser.bind(this);
    return async (collection: EntityCollection<IFlow & ISaved>) => {
      const boards = await asyncPipe(
        (collection: EntityCollection<IFlow & ISaved>) => collection.values(),
        (it) => Array.from(it),
      )(collection);

      if (boards.length === 0) {
        return '';
      }

      // parse
      const parseTable = getTableParser(boards);
      return await parseTable(boards);
    };
  }

  public get detail() {
    const parseFlowStep = this.parsers.flowStep.parseForFlowDetail.bind(
      this.parsers.flowStep,
    );
    const parseId = this.parsers.base.parseId.bind(this.parsers.base);
    const parseEntityDate = this.parsers.base.parseEntityDate.bind(
      this.parsers.base,
    );
    return async (flow: IFlow) => {
      let result = '';

      if (entityIsSaved(flow)) {
        result += `${flow.name}`.trim();
        const idStr = await parseId()(flow);
        const dateStr = await parseEntityDate()(flow);
        result += `\n\n${idStr} ${dateStr}`;
      } else {
        result += `${flow.name}`;
        result += `\n\nNot saved yet`;
      }

      if (flow.description !== undefined) {
        result += `\n\n${flow.description}`;
      }
      result += `\n`;
      for (const flowStep of flow.steps.values()) {
        const flowStepStr = await parseFlowStep({})(flowStep);
        result += `\n${flowStepStr}`;
      }
      return result.trim();
    };
  }

  public get parseName(): TItemParser<IFlow | undefined> {
    return ({ width, align = 'left' } = {}) =>
      async (entity) => {
        let result = entity === undefined ? '' : `[${entity.name}]`;
        if (width !== undefined) {
          result = StringUtils.align(width, align)(result);
        }
        return result;
      };
  }

  public get parseForBoard(): TItemParser<IBoard & ISaved> {
    const parseName = this.parseName.bind(this);
    return (opts = {}) =>
      async (board) => {
        const flowStep = board.flow;
        return await parseName(opts)(flowStep);
      };
  }
}

export type TParserFlowOperators = ParserFlowOperators;
