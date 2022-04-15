import { Identificators as TMIdentificators } from 'todo-manager';
import { ParsingIdentificators } from './operators/parsing/identificators';

export namespace Identificators {
  export const ConfigurationOperators = Symbol();
  export const LoggingOperators = Symbol();
  export const EntityCacheOperators = Symbol();
  export const YAMLCacheOperators = Symbol();
  export const FileSourceSerializingOperators = Symbol();
  export const TerminalOperators = Symbol();
  export const EditionOperators = Symbol();
  export const ParsingOperations = ParsingIdentificators;
  export const tm = TMIdentificators;
}
