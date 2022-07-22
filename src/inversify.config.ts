import 'reflect-metadata';
import { interfaces, Container } from 'inversify';
import { IEntityOperators} from 'todo-manager';
import { Identificators } from './identificators';
import {
  ConfigurationOperators,
  TConfigurationOperators,
  TTerminalOperators,
  TerminalOperators,
  TTaskOperators,
  EntityCacheOperators,
  TEntityCacheOperators,
  TBoardOperators,
  TFlowStepOperators,
  TFlowOperators,
  ISourceOperators,
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
  source: ISourceOperators;
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
const getContainerContainer = (() => {
  const containerContainer: { container?: interfaces.Container } = {};
  return () => containerContainer;
})();

export const setContainer = (container: interfaces.Container) => {
  const containerContainer = getContainerContainer();
  containerContainer.container = container;
};

export const getContainer = async (): Promise<interfaces.Container> => {
  const { container } = getContainerContainer();
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

  parsingBinding(baseContainer);

  baseContainer
    .bind<TTerminalOperators>(Identificators.TerminalOperators)
    .to(TerminalOperators);

  baseContainer
    .bind<TEditionOperators>(Identificators.EditionOperators)
    .to(EditionOperators);

  setContainer(baseContainer);
  return getContainer();
};

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

    return new (class implements ICliOperators {
      public constructor(protected container: interfaces.Container) {}

      public get configuration(): TConfigurationOperators {
        return this.container.get<TConfigurationOperators>(
          Identificators.ConfigurationOperators
        )
      }

      public get parsing() {
        return getParsingOperators(this.container);
      }

      public get source(): ISourceOperators {
        return this.container.get<ISourceOperators>(Identificators.tm.Source);
      }

      public get terminal(): TTerminalOperators{
        return this.container.get<TTerminalOperators>(
          Identificators.TerminalOperators,
        );
      }

      public get edition(): TEditionOperators {
        return this.container.get<TEditionOperators>(
          Identificators.EditionOperators,
        );
      }

      public get entity(): IEntityOperators {
        return this.container.get<IEntityOperators>(
          Identificators.tm.EntityOperators,
        );
      }

      public get task(): TTaskOperators {
        return this.container.get<TTaskOperators>(Identificators.tm.TaskOperators);
      }

      public get flowStep(): TFlowStepOperators {
        return this.container.get<TFlowStepOperators>(
          Identificators.tm.FlowStepOperators,
        );
      }

      public get flow(): TFlowOperators {
        return this.container.get<TFlowOperators>(Identificators.tm.FlowOperators);
      }

      public get board(): TBoardOperators {
        return this.container.get<TBoardOperators>(Identificators.tm.BoardOperators);
      }

    })(container);
  };
})();
