import {
  EntityCollection,
  IBoard,
  Id,
  IEntity,
  IFlow,
  IFlowStep,
  ISaved,
  ITask,
} from 'todo-manager';
import { CliError } from '../../errors';
import { getOperators } from '../../inversify.config';
import { asyncMap, asyncPipe, asyncTap, commandAction } from '../../lib';

type TMoveTaskArgs = [string[]];
interface IMoveTaskOps {
  orphan?: boolean;
  board?: string;
  step?: string;
}
export const moveTask = commandAction<TMoveTaskArgs, IMoveTaskOps>(
  async ({
    args: [taskSelectors],
    options: {
      board: boardSelector,
      step: stepSelector,
      orphan: setOrphan = false,
    },
  }) => {
    if (
      boardSelector === undefined &&
      stepSelector === undefined &&
      !setOrphan
    ) {
      throw new CliError(`Some option should be provided.`);
    }

    if (setOrphan) {
      return await setTasksOrphan(taskSelectors);
    }

    const ops = await getOperators();

    const getValues = <T>(map: Map<any, T>): Iterable<T> => map.values();
    const extractIds = <E extends IEntity & ISaved>(
      entities: Iterable<E>,
    ): Id[] => Array.from(entities).map((entity) => entity.id);
    const getTasks = asyncPipe(
      asyncMap((regexp: string) => ops.task.getCollectionByRegExp(regexp)),
      ops.entity.mergeCollections,
    );

    // get tasks
    const tasks = await getTasks(taskSelectors);
    const taskIds = await asyncPipe(() => tasks, getValues, extractIds)();

    // get board explicitly
    let board: (IBoard & ISaved) | undefined = undefined;
    if (boardSelector !== undefined) {
      board = await ops.board.getOrFailByRegExp(boardSelector);
    }

    // get flow implicitly: All selected task belong to a flow and the same flow.
    let implicitFlow: (IFlow & ISaved) | undefined = undefined;
    if (board === undefined) {
      let thereIsOrphan = false;
      const taskFlows: EntityCollection<IFlow & ISaved> = new Map();
      for (
        let i = 0;
        !thereIsOrphan && taskFlows.size < 2 && i < taskIds.length;
        i++
      ) {
        const id = taskIds[i] as Id;
        const taskBoard = await ops.task.getBoard(id);
        if (taskBoard === undefined) {
          thereIsOrphan = true;
        } else {
          const flow = taskBoard.flow as IFlow & ISaved;
          taskFlows.set(flow.id, flow);
        }
      }
      if (!thereIsOrphan && taskFlows.size === 1) {
        implicitFlow = taskFlows.values().next().value as IFlow & ISaved;
      }
    }

    // get step
    let flowStep: IFlowStep & ISaved;
    if (stepSelector === undefined && board === undefined) {
      // this should be never reached
      throw new CliError(`Option '-b' or '-s' should be provided.`);
    } else if (stepSelector === undefined && board !== undefined) {
      const flow = board.flow as IFlow & ISaved;
      if (flow.defaultStepId) {
        flowStep = await ops.flowStep.getOrFail(flow.defaultStepId);
      } else {
        throw new CliError(
          'Selected board without a default step and step not provided.',
        );
      }
    } else if (board !== undefined) {
      const flow = board.flow as IFlow & ISaved;
      flowStep = await ops.flowStep.getOrFailWithFilters({
        regexp: stepSelector,
        flow,
      });
    } else if (implicitFlow !== undefined) {
      flowStep = await ops.flowStep.getOrFailWithFilters({
        regexp: stepSelector,
        flow: implicitFlow,
      });
    } else {
      throw new CliError('Step is selected but not board is selected.');
    }

    const moveTasksToBoard =
      (flowStep: IFlowStep & ISaved) =>
      (tasks: EntityCollection<ITask & ISaved>) =>
      async (board: IBoard & ISaved): Promise<IBoard & ISaved> => {
        let newBoard: IBoard = ops.board.clone(board);
        for (const task of tasks.values()) {
          newBoard = await ops.board.addTask(task)(newBoard);
          newBoard = await ops.board.setTaskStep(flowStep)(task)(newBoard);
        }
        return newBoard as IBoard & ISaved;
      };
    const moveTasksAndSave =
      (flowStep: IFlowStep & ISaved) =>
      (tasks: EntityCollection<ITask & ISaved>) =>
        asyncPipe(moveTasksToBoard(flowStep)(tasks), ops.board.save);

    if (board !== undefined) {
      await moveTasksAndSave(flowStep)(tasks)(board);
    } else {
      const taskBoards = await ops.task.getCollectionBoardMapping(tasks);
      const boards: EntityCollection<IBoard & ISaved> = new Map();
      const boardTasks: Map<Id, EntityCollection<ITask & ISaved>> = new Map();
      for (const [taskId, board] of taskBoards.entries()) {
        const task = tasks.get(taskId) as ITask & ISaved;
        boards.set(board.id, board);
        if (!boardTasks.has(board.id)) {
          boardTasks.set(board.id, new Map());
        }
        const btasks = boardTasks.get(board.id) as EntityCollection<
          ITask & ISaved
        >;
        btasks.set(task.id, task);
      }

      for (const board of boards.values()) {
        const btasks = boardTasks.get(board.id) as EntityCollection<
          ITask & ISaved
        >;
        await moveTasksAndSave(flowStep)(btasks)(board);
      }
    }

    const printIds = asyncTap(
      asyncPipe((taskIds: Id[]) => taskIds.join('\n'), ops.terminal.out),
    );
    await printIds(taskIds);
  },
);

const setTasksOrphan = async (taskSelectors: string[]) => {
  const ops = await getOperators();
  const getTasks = asyncPipe(
    asyncMap((regexp: string) => ops.task.getCollectionByRegExp(regexp)),
    ops.entity.mergeCollections,
  );
  const getValues = <T>(map: Map<any, T>): Iterable<T> => map.values();
  const extractIds = <E extends IEntity & ISaved>(
    entities: Iterable<E>,
  ): Id[] => Array.from(entities).map((entity) => entity.id);

  // get tasks
  const tasks = await getTasks(taskSelectors);

  // remove tasks at once
  const removeTasksFromBoard =
    (tasks: EntityCollection<ITask & ISaved>) =>
    async (board: IBoard & ISaved): Promise<IBoard & ISaved> => {
      let newBoard: IBoard = ops.board.clone(board);
      for (const task of tasks.values()) {
        newBoard = await ops.board.removeTask(task)(newBoard);
      }
      return newBoard as IBoard & ISaved;
    };
  const removeTasksAndSave = (tasks: EntityCollection<ITask & ISaved>) =>
    asyncPipe(removeTasksFromBoard(tasks), ops.board.save);

  // operate by boards
  const taskBoards = await ops.task.getCollectionBoardMapping(tasks);
  const boards: EntityCollection<IBoard & ISaved> = new Map();
  const boardTasks: Map<Id, EntityCollection<ITask & ISaved>> = new Map();
  for (const [taskId, board] of taskBoards.entries()) {
    const task = tasks.get(taskId) as ITask & ISaved;
    boards.set(board.id, board);
    if (!boardTasks.has(board.id)) {
      boardTasks.set(board.id, new Map());
    }
    const btasks = boardTasks.get(board.id) as EntityCollection<ITask & ISaved>;
    btasks.set(task.id, task);
  }

  // perform operation
  for (const board of boards.values()) {
    const btasks = boardTasks.get(board.id) as EntityCollection<ITask & ISaved>;
    await removeTasksAndSave(btasks)(board);
  }

  const printTaskIds = asyncPipe(
    () => tasks,
    getValues,
    extractIds,
    (taskIds: Id[]) => taskIds.join('\n'),
    ops.terminal.out,
  );
  await printTaskIds();
};
