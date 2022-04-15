import { inject, injectable } from 'inversify';
import { IFlowStep, ISaved, ITask } from 'todo-manager';
import { StringUtils } from '../../lib';
import { Identificators } from '../../identificators';
import { TItemParser } from '../../models';
import { TConfigurationOperators } from '../configuration';
import { TParserBaseOperators } from './base';
import { ParsingIdentificators } from './identificators';
import { TBoardOperators, TTaskOperators } from '../todo-manager';
import { TParserTableOperators } from './table';
import { TParserCacheOperators } from './cache';
import { TLoggingOperators } from '../logging';

@injectable()
export class ParserFlowStepOperators {
  protected tm: {
    task: TTaskOperators;
    board: TBoardOperators;
  };
  protected parsers: {
    base: TParserBaseOperators;
    cache: TParserCacheOperators;
    table: TParserTableOperators;
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
  ) {
    this.tm = {
      task: tmTask,
      board: tmBoard,
    };
    this.parsers = {
      base: pBase,
      cache: pCache,
      table: pTable,
    };
  }

  public get parseName(): TItemParser<IFlowStep | undefined> {
    const isColorAllowed = this.parsers.base.isColorAllowed.bind(
      this.parsers.base,
    );
    const setColor = this.parsers.base.setColor.bind(this.parsers.base);
    return ({ width, align = 'left', allowColor } = {}) =>
      async (entity) => {
        let result = entity === undefined ? '' : `[${entity.name}]`;
        if (width !== undefined) {
          result = StringUtils.align(width, align)(result);
        }
        if (await isColorAllowed(allowColor)) {
          result = setColor(entity?.color)(result);
        }
        return result;
      };
  }

  public get parseForTask(): TItemParser<ITask & ISaved> {
    const logging = this.logging;
    const getTaskStep = this.parsers.cache.getTaskStep.bind(this.parsers.cache);
    const parseName = this.parseName.bind(this);
    return (opts = {}) =>
      logging.logAsyncOperation('ParserFlowStep.parseForTask()')(
        async (task) => {
          const flowStep = await getTaskStep(task);
          return await parseName(opts)(flowStep);
        },
      );
  }

  public get parseForFlowDetail(): TItemParser<IFlowStep & ISaved> {
    const logging = this.logging;
    const parseName = this.parseName.bind(this);
    return (opts = {}) =>
      logging.logAsyncOperation('ParseFlowStep.parseForFlowDetail()')(
        async (flowStep) => {
          let result = ``;
          result += await parseName(opts)(flowStep);
          if (flowStep.description !== undefined) {
            result += `\n${flowStep.description}`;
          }
          return result;
        },
      );
  }
}

export type TParserFlowStepOperators = ParserFlowStepOperators;
