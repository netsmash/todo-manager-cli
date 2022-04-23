import { getOperators } from '../../inversify.config';
import { commandAction } from '../../lib';

type TShowConfigurationArgs = [];
interface IShowConfigurationOps {};
export const showConfiguration = commandAction<TShowConfigurationArgs, IShowConfigurationOps>(
  async ({
    args: [],
    options: { },
  }) => {
    const ops = await getOperators();
    const configurationState = ops.configuration.state;
    ops.terminal.out(await ops.parsing.configuration.main(configurationState));
  },
);
