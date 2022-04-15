import { EditionCancelException } from '../../errors';
import { getOperators } from '../../inversify.config';
import { asyncPipe, commandAction } from '../../lib';

type TEditTaskArgs = [string];
interface IEditTaskOps {
  name?: string;
}
export const editTask = commandAction<TEditTaskArgs, IEditTaskOps>(
  async ({ args: [taskSelector], options: { name } }) => {
    const ops = await getOperators();
    const task = await ops.task.getOrFailByRegExp(taskSelector);

    let nameDescription: { name: string; description?: string };
    if (name === undefined) {
      try {
        nameDescription = await ops.edition.editNameDescription({
          default: {
            name: task.name,
            description: task.description,
          },
        });
      } catch (error: any) {
        if (error instanceof EditionCancelException) {
          return;
        } else {
          throw error;
        }
      }
    } else {
      nameDescription = { name };
    }
    await asyncPipe(ops.task.update(nameDescription), ops.task.save, (task) =>
      ops.terminal.out(`${String(task.id)}`),
    )(task);
  },
);
