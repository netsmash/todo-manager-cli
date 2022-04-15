import { interfaces } from 'inversify';
import { ParsingIdentificators } from './identificators';
import { ParserBaseOperators, TParserBaseOperators } from './base';
import { ParserTaskOperators, TParserTaskOperators } from './task';
import { ParserTableOperators, TParserTableOperators } from './table';
import { ParserFlowStepOperators, TParserFlowStepOperators } from './flow-step';
import { ParserBoardOperators, TParserBoardOperators } from './board';
import { ParserFlowOperators, TParserFlowOperators } from './flow';
import { ParserCacheOperators, TParserCacheOperators } from './cache';

// DO NOT EXPORT, so we avoid circular dependencies
// export * from './identificators';
export * from './base';
export * from './task';
export * from './flow-step';

export interface IParsingOperators {
  task: TParserTaskOperators;
  flowStep: TParserFlowStepOperators;
  board: TParserBoardOperators;
  flow: TParserFlowOperators;
}

export const parsingBinding = (container: interfaces.Container) => {
  container
    .bind<TParserBaseOperators>(ParsingIdentificators.Base)
    .to(ParserBaseOperators);

  container
    .bind<TParserCacheOperators>(ParsingIdentificators.Cache)
    .to(ParserCacheOperators);

  container
    .bind<TParserTableOperators>(ParsingIdentificators.Table)
    .to(ParserTableOperators);

  container
    .bind<TParserTaskOperators>(ParsingIdentificators.Task)
    .to(ParserTaskOperators);

  container
    .bind<TParserFlowStepOperators>(ParsingIdentificators.FlowStep)
    .to(ParserFlowStepOperators);

  container
    .bind<TParserBoardOperators>(ParsingIdentificators.Board)
    .to(ParserBoardOperators);

  container
    .bind<TParserFlowOperators>(ParsingIdentificators.Flow)
    .to(ParserFlowOperators);
};

export const getParsingOperators = (
  container: interfaces.Container,
): IParsingOperators => ({
  task: container.get<TParserTaskOperators>(ParsingIdentificators.Task),
  flowStep: container.get<TParserFlowStepOperators>(
    ParsingIdentificators.FlowStep,
  ),
  board: container.get<TParserBoardOperators>(ParsingIdentificators.Board),
  flow: container.get<TParserFlowOperators>(ParsingIdentificators.Flow),
});
