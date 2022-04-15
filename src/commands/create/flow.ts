import { Id, IFlow } from 'todo-manager';
import { IFlowEdition } from '../../models';
import { getOperators } from '../../inversify.config';
import { asyncPipe, commandAction } from '../../lib';
import newFlowTemplate from '../../templates/new-flow.json';

type TCreateFlowArgs = [string | undefined];
interface ICreateFlowOps {
  name?: string;
}
export const createFlow = commandAction<TCreateFlowArgs, ICreateFlowOps>(
  async ({ args: [flowId], options: { name } }) => {
    const ops = await getOperators();

    const editNewFlow = async () => {
      if (name !== undefined) {
        newFlowTemplate.name = name;
      }
      return await ops.edition.editFlow({
        default: newFlowTemplate as IFlowEdition,
      });
    };

    const flow = await asyncPipe(
      editNewFlow,
      ops.edition.createFlowFromEdition,
      async (flow: IFlow): Promise<IFlow> => {
        if (flowId === undefined) {
          return flow;
        }
        flow.id = flowId;
        return flow;
      },
      ops.flow.save,
    )();
    const stepIds = Array.from(flow.steps.values()).map(({ id }) => id);
    const ids: Id[] = [flow.id, ...stepIds];
    ops.terminal.out(ids.map((id) => `${String(id)}`).join('\n'));
  },
);
