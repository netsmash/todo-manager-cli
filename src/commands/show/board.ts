import { getOperators } from '../../inversify.config';
import { asyncPipe, commandAction } from '../../lib';

type TShowBoardArgs = [string | undefined];
interface IShowBoardOps {
  filter?: string;
}
export const showBoard = commandAction<TShowBoardArgs, IShowBoardOps>(
  async ({ args: [boardId], options: { filter } }) => {
    const ops = await getOperators();

    if (boardId !== undefined) {
      return showBoardDetail(boardId);
    }

    const getBoards = async () => {
      if (filter !== undefined) {
        return await ops.board.getCollectionByRegExp(filter);
      }
      return ops.board.list();
    };

    const parseBoards = asyncPipe(getBoards, ops.parsing.board.collection);
    ops.terminal.out(await parseBoards());
  },
);

const showBoardDetail = async (regex: string) => {
  const ops = await getOperators();
  const board = await ops.board.getOrFailByRegExp(regex);
  ops.terminal.out(await ops.parsing.board.detail(board));
};
