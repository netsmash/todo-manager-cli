import { Id, IFlow, IFlowStep, ISaved } from 'todo-manager';
import { getOperators } from '../../inversify.config';
import { commandAction } from '../../lib';

type TEditFlowArgs = [string];
interface IEditFlowOps {
  name?: string;
}
export const editFlow = commandAction<TEditFlowArgs, IEditFlowOps>(
  async ({ args: [flowSelector], options: { name } }) => {
    const ops = await getOperators();
    const flow = await ops.flow.getOrFailByRegExp(flowSelector);

    const affectedIds: Set<Id> = new Set();

    let editedFlow: (IFlow & ISaved) | undefined;
    if (name !== undefined) {
      editedFlow = ops.flow.update({ name })(flow);
    } else {
      const flowEdition = await ops.edition.editFlow({ default: flow });
      editedFlow = await ops.edition.editFlowFromEdition(flow)(flowEdition);
      const mutableActions = new Set(['add', 'edit', 'remove']);
      (flowEdition.steps || [])
        .filter((stepAction) => mutableActions.has(stepAction.action))
        .forEach((stepAction) => {
          if (stepAction.action === 'add') {
            const step = Array.from((editedFlow as IFlow).steps.values()).find(
              ({ name }) => stepAction.name === name,
            ) as IFlowStep & ISaved;
            affectedIds.add(step.id);
          } else {
            const step = Array.from(flow.steps.values()).find(
              ({ name }) => stepAction.name === name,
            ) as IFlowStep & ISaved;
            affectedIds.add(step.id);
          }
        });
    }

    await ops.flow.save(editedFlow);

    affectedIds.add(editedFlow.id);
    ops.terminal.out(
      Array.from(affectedIds)
        .map((id) => `${String(id)}`)
        .join('\n'),
    );
  },
);
