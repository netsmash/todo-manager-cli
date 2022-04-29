import { Identificators as TMIdentificators } from 'todo-manager';
import { ParsingIdentificators } from './operators/parsing/identificators';

export namespace Identificators {
  export const ConfigurationOperators = Symbol('ConfigurationOperators');
  export const LoggingOperators = Symbol('LoggingOperators');
  export const EntityCacheOperators = Symbol('EntityCacheOperators');
  export const TerminalOperators = Symbol('TerminalOperators');
  export const EditionOperators = Symbol('EditionOperators');
  export const ParsingOperations = ParsingIdentificators;
  export const tm = TMIdentificators;
}
