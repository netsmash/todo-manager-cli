import { Identificators } from '../../identificators';
import { Container, interfaces } from 'inversify';
import { TParserConfigurationOperators } from '../../operators/parsing/configuration';
import { getContainer as getTMContainer, Identificators as TMIdentificators } from 'todo-manager';
import { setContainer } from '../../inversify.config';
import {
  BoardOperators,
  EntityOperators,
  FlowOperators,
  FlowStepOperators,
  TaskOperators,
} from '../../operators';
import {
  TYAMLConfigurationOperators,
  YAMLConfigurationOperators,
} from './configuration';
import { ParserConfigurationOperators } from './configuration-parser';
import { Identificators as ModuleIdentificators } from './identificators';
import {
  FileSourceSerializingOperatorsProvider,
  TFileSourceSerializingOperators,
} from './serializers';
import { TYAMLCacheOperators, YAMLCacheOperators } from './yml-cache';
import { provideYAMLFileSourceOperators } from './yml-file-source';

export const yamlSourceBinding = async (container: interfaces.Container) => {

  if (container.isBound(ModuleIdentificators.YAMLConfigurationOperators)) {
    container.unbind(ModuleIdentificators.YAMLConfigurationOperators);
  }
  container
    .bind<TYAMLConfigurationOperators>(
      ModuleIdentificators.YAMLConfigurationOperators,
    )
    .toDynamicValue(
      (context: interfaces.Context) => new YAMLConfigurationOperators(context)
    );

  if (container.isBound(ModuleIdentificators.YAMLCacheOperators)) {
    container.unbind(ModuleIdentificators.YAMLCacheOperators);
  }
  container
    .bind<TYAMLCacheOperators>(ModuleIdentificators.YAMLCacheOperators)
    .to(YAMLCacheOperators);

  if (container.isBound(ModuleIdentificators.FileSourceSerializingOperators)) {
    container.unbind(ModuleIdentificators.FileSourceSerializingOperators);
  }
  container
    .bind<TFileSourceSerializingOperators>(
      ModuleIdentificators.FileSourceSerializingOperators,
    )
    .toDynamicValue(FileSourceSerializingOperatorsProvider);

  if (container.isBound(ModuleIdentificators.YAMLConfigurationParserBaseOperators)) {
    container.unbind(ModuleIdentificators.YAMLConfigurationParserBaseOperators);
  }
  container.rebind<TParserConfigurationOperators>(Identificators.ParsingOperations.Configuration).to(ParserConfigurationOperators);


  Array.from(Object.values(TMIdentificators))
    .filter(id => container.isBound(id))
    .forEach(id => container.unbind(id));

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

  const newContainer = Container.merge(container, tmContainer);
  setContainer(newContainer);
  return newContainer;
};
