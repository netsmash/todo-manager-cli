import { EditionCancelException } from '../../errors';
import { getOperators } from '../../inversify.config';
import { asyncPipe, commandAction } from '../../lib';
import newBoardTemplate from '../../templates/new-board.json';

type TCreateBoardArgs = [string, string | undefined];
interface ICreateBoardOps {
  name?: string;
}
export const createBoard = commandAction<TCreateBoardArgs, ICreateBoardOps>(
  async ({ args: [flowSelector, boardId], options: { name } }) => {
    const ops = await getOperators();

    const flow = await ops.flow.getOrFailByRegExp(flowSelector);

    let nameDescription: { name: string; description?: string };
    if (name === undefined) {
      try {
        nameDescription = await ops.edition.editNameDescription({
          default: newBoardTemplate,
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

    const createBoard = asyncPipe(
      () => ({ id: boardId, ...nameDescription, flow }),
      ops.board.create,
    );
    const board = await createBoard();
    ops.terminal.out(`${String(board.id)}`);
  },
);
