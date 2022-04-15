import 'reflect-metadata';
import { interfaces, Container } from 'inversify';
import { IEntityOperators, getContainer as getTMContainer } from 'todo-manager';
import { Identificators } from './identificators';
import {
  ConfigurationOperators,
  TConfigurationOperators,
  TFileSourceSerializingOperators,
  provideYAMLFileSourceOperators,
  FileSourceSerializingOperatorsProvider,
  TTerminalOperators,
  TerminalOperators,
  TaskOperators,
  BoardOperators,
  TTaskOperators,
  EntityOperators,
  EntityCacheOperators,
  TEntityCacheOperators,
  TBoardOperators,
  TFlowStepOperators,
  FlowStepOperators,
  TFlowOperators,
  FlowOperators,
  TYAMLFileSourceOperators,
  YAMLCacheOperators,
  TYAMLCacheOperators,
  TLoggingOperators,
  LoggingOperators,
  parsingBinding,
  getParsingOperators,
  IParsingOperators,
  TEditionOperators,
  EditionOperators,
} from './operators';

interface ICliOperators {
  configuration: TConfigurationOperators;
  parsing: IParsingOperators;
  source: TYAMLFileSourceOperators;
  terminal: TTerminalOperators;
  edition: TEditionOperators;
  entity: IEntityOperators;
  task: TTaskOperators;
  flowStep: TFlowStepOperators;
  flow: TFlowOperators;
  board: TBoardOperators;
}

/**
 * Singleton
 */
export const getContainer = (() => {
  let container: undefined | interfaces.Container;
  return async () => {
    if (container !== undefined) {
      return container;
    }

    // base container
    const baseContainer = new Container({ defaultScope: 'Singleton' });

    baseContainer
      .bind<TConfigurationOperators>(Identificators.ConfigurationOperators)
      .to(ConfigurationOperators);

    baseContainer
      .bind<TLoggingOperators>(Identificators.LoggingOperators)
      .to(LoggingOperators);

    baseContainer
      .bind<TEntityCacheOperators>(Identificators.EntityCacheOperators)
      .to(EntityCacheOperators);

    baseContainer
      .bind<TYAMLCacheOperators>(Identificators.YAMLCacheOperators)
      .to(YAMLCacheOperators);

    parsingBinding(baseContainer);

    baseContainer
      .bind<TTerminalOperators>(Identificators.TerminalOperators)
      .to(TerminalOperators);

    baseContainer
      .bind<TEditionOperators>(Identificators.EditionOperators)
      .to(EditionOperators);

    baseContainer
      .bind<TFileSourceSerializingOperators>(
        Identificators.FileSourceSerializingOperators,
      )
      .toDynamicValue(FileSourceSerializingOperatorsProvider);

    // obtain todo-manager container
    const tmContainer = getTMContainer({
      providers: {
        source: provideYAMLFileSourceOperators,
        entity: (context) => new EntityOperators(context),
        task: (context) => new TaskOperators(context),
        board: (context) => new BoardOperators(context),
        flowStep: (context) => new FlowStepOperators(context),
        flow: (context) => new FlowOperators(context),
      },
    });
    container = Container.merge(baseContainer, tmContainer);
    return container;
  };
})();

/**
 * Singleton
 */
export const getOperators = (() => {
  let ops: undefined | ICliOperators;
  return async () => {
    if (ops !== undefined) {
      return ops;
    }
    const container = await getContainer();

    ops = {
      configuration: container.get<TConfigurationOperators>(
        Identificators.ConfigurationOperators,
      ),
      parsing: getParsingOperators(container),
      source: container.get<TYAMLFileSourceOperators>(Identificators.tm.Source),
      terminal: container.get<TTerminalOperators>(
        Identificators.TerminalOperators,
      ),
      edition: container.get<TEditionOperators>(
        Identificators.EditionOperators,
      ),
      entity: container.get<IEntityOperators>(
        Identificators.tm.EntityOperators,
      ),
      task: container.get<TTaskOperators>(Identificators.tm.TaskOperators),
      flowStep: container.get<TFlowStepOperators>(
        Identificators.tm.FlowStepOperators,
      ),
      flow: container.get<TFlowOperators>(Identificators.tm.FlowOperators),
      board: container.get<TBoardOperators>(Identificators.tm.BoardOperators),
    };

    return ops;
  };
})();
