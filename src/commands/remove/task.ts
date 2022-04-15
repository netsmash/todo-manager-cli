import { EntityCollection, Id, ISaved, ITask } from 'todo-manager';
import { getOperators } from '../../inversify.config';
import { asyncMap, asyncPipe, asyncQueuedMap, commandAction } from '../../lib';

type TRemoveTaskArgs = [string[]];
interface IRemoveTaskOps {
  confirm?: boolean;
}
export const removeTask = commandAction<TRemoveTaskArgs, IRemoveTaskOps>(
  async ({
    args: [taskSelectors],
    options: { confirm: deleteConfirmed = false },
  }) => {
    const ops = await getOperators();

    const askConfirmDelete = async (
      collection: EntityCollection<ITask & ISaved>,
    ) => {
      if (collection.size === 0) {
        return false;
      }
      const collectionStr = await ops.parsing.task.collection(collection);
      return await ops.terminal.askYesNo(
        `The following ${collection.size} tasks are going to be deleted:` +
          `\n\n${collectionStr}\n` +
          `\nDo you want to proceed?`,
        false,
      );
    };

    const ensureDelete = async (
      collection: EntityCollection<ITask & ISaved>,
    ): Promise<EntityCollection<ITask & ISaved>> =>
      deleteConfirmed || (await askConfirmDelete(collection))
        ? collection
        : new Map();

    await asyncPipe(
      asyncMap((regexp: string) => ops.task.getCollectionByRegExp(regexp)),
      ops.entity.mergeCollections,
      ensureDelete,
      (collection: EntityCollection<ITask & ISaved>) => collection.values(),
      asyncQueuedMap(ops.task.delete),
      asyncMap((task: ITask & ISaved) => task.id),
      (taskIds: Id[]) => taskIds.join('\n'),
      ops.terminal.out,
    )(taskSelectors);
  },
);
