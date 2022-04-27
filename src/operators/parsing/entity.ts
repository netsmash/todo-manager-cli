import { inject, injectable } from 'inversify';
import { EntityCollection, ISaved, IEntity } from 'todo-manager';
import { Identificators } from '../../identificators';
import { TConfigurationOperators } from '../configuration';
import { TParserBaseOperators } from './base';
import { ParsingIdentificators } from './identificators';
import { TLoggingOperators } from '../logging';
import { asyncMap, asyncPipe } from '../../lib';

@injectable()
export class ParserEntityOperators {
  protected tm: {};
  protected parsers: {
    base: TParserBaseOperators;
  };

  public constructor(
    @inject(Identificators.ConfigurationOperators)
    protected config: TConfigurationOperators,
    @inject(Identificators.LoggingOperators)
    protected logging: TLoggingOperators,
    @inject(ParsingIdentificators.Base) pBase: TParserBaseOperators,
  ) {
    this.tm = {};
    this.parsers = {
      base: pBase,
    };
  }

  public get collectionIds() {
    const logging = this.logging;
    const parseId = this.parsers.base.parseId.bind(this.parsers.base);
    return logging.logAsyncOperation('ParserEntity.collectionIds()')(
      async (collection: EntityCollection<IEntity & ISaved>) => {
        const lines: string[] = await asyncPipe(
          asyncMap(parseId({ allowColor: false })),
        )(collection.values());
        return lines.join(`\n`);
      },
    );
  }

  public get id() {
    const logging = this.logging;
    const parseId = this.parsers.base.parseId.bind(this.parsers.base);
    return logging.logAsyncOperation('ParserEntity.id()')(
      parseId({ allowColor: false }),
    );
  }
}

export type TParserEntityOperators = ParserEntityOperators;
