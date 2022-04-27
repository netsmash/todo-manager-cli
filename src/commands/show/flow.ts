import { getOperators } from '../../inversify.config';
import { asyncPipe, commandAction } from '../../lib';

type TShowFlowArgs = [string | undefined];
interface IShowFlowOps {
  filter?: string;
  quiet?: boolean;
}
export const showFlow = commandAction<TShowFlowArgs, IShowFlowOps>(
  async ({
    args: [flowId],
    options: { filter, quiet: showOnlyIds = false },
  }) => {
    const ops = await getOperators();

    if (flowId !== undefined) {
      return showFlowDetail(flowId, { quiet: showOnlyIds });
    }

    const getFlows = async () => {
      if (filter !== undefined) {
        return await ops.flow.getCollectionByRegExp(filter);
      }
      return ops.flow.list();
    };

    const parseFlows = asyncPipe(
      getFlows,
      showOnlyIds
        ? ops.parsing.entity.collectionIds
        : ops.parsing.flow.collection,
    );
    ops.terminal.out(await parseFlows());
  },
);

interface IShowFlowDetailOps {
  quiet?: boolean;
}
const showFlowDetail = async (
  regex: string,
  { quiet: showOnlyId = false }: IShowFlowDetailOps = {},
) => {
  const ops = await getOperators();
  const flow = await ops.flow.getOrFailByRegExp(regex);
  ops.terminal.out(
    showOnlyId
      ? await ops.parsing.entity.id(flow)
      : await ops.parsing.flow.detail(flow),
  );
};
