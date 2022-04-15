import {
  EntityType,
  IFlow,
  FlowOperators as FlowOperatorsBase,
  Id,
  ISaved,
  EntityCollection,
  isId,
  IBoard,
} from 'todo-manager';

export class FlowOperators extends FlowOperatorsBase {
  public get getOrFailByRegExp() {
    return this.entity.getOrFailByRegExp<IFlow>(EntityType.Flow);
  }

  public get getCollectionByRegExp() {
    return this.entity.getCollectionByRegExp<IFlow>(EntityType.Flow);
  }

  public get getBoards() {
    return async (
      flowOrId: (IFlow & ISaved) | Id,
    ): Promise<EntityCollection<IBoard & ISaved>> => {
      const flowId: Id = isId(flowOrId) ? flowOrId : flowOrId.id;
      const allBoards = await this.board.list();
      const boards = Array.from(allBoards.values()).filter(
        ({ flow }) => flow.id === flowId,
      );
      return this.entity.toCollection(boards);
    };
  }
}

export type TFlowOperators = FlowOperators;
