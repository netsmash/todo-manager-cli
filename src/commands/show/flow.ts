import { getOperators } from '../../inversify.config';
import { asyncPipe, commandAction } from '../../lib';

type TShowFlowArgs = [string | undefined];
interface IShowFlowOps {
  filter?: string;
}
export const showFlow = commandAction<TShowFlowArgs, IShowFlowOps>(
  async ({ args: [flowId], options: { filter } }) => {
    const ops = await getOperators();

    if (flowId !== undefined) {
      return showFlowDetail(flowId);
    }

    const getFlows = async () => {
      if (filter !== undefined) {
        return await ops.flow.getCollectionByRegExp(filter);
      }
      return ops.flow.list();
    };

    const parseFlows = asyncPipe(getFlows, ops.parsing.flow.collection);
    ops.terminal.out(await parseFlows());
  },
);

const showFlowDetail = async (regex: string) => {
  const ops = await getOperators();
  const flow = await ops.flow.getOrFailByRegExp(regex);
  ops.terminal.out(await ops.parsing.flow.detail(flow));
};
