import { interfaces } from 'inversify';
import { SourceOperatorsMock, TSourceOperatorsMock } from '../../__mocks__';
import { getContainer, getOperators } from '../../inversify.config';
import { Identificators } from '../../identificators';

describe('Cli performance', () => {
  let container: interfaces.Container;
  let source: TSourceOperatorsMock;

  beforeEach(async () => {
    container = await getContainer();
    container
      .bind<TSourceOperatorsMock>(Identificators.tm.Source)
      .toDynamicValue((context) => new SourceOperatorsMock(context, expect));

    source = container.get<TSourceOperatorsMock>(Identificators.tm.Source);
  });

  it('Create IEntity', async () => {
    const ops = await getOperators();
  });
});
