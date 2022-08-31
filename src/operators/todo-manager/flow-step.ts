import {
  EntityType,
  IFlowStep,
  FlowStepOperators as FlowStepOperatorsBase,
  ISaved,
  EntityCollection,
} from 'todo-manager';
import { EntityDoesNotExistError, EntityIsNotUniqueError } from '../../errors';
import { IFlowStepFilters } from '../../models';

export class FlowStepOperators extends FlowStepOperatorsBase {
  public get getOrFailByRegExp() {
    const entityOps = this.entity;
    return entityOps.getOrFailByRegExp<IFlowStep>(EntityType.FlowStep);
  }

  public get getCollectionByRegExp() {
    const entityOps = this.entity;
    return entityOps.getCollectionByRegExp<IFlowStep>(EntityType.FlowStep);
  }

  public get getOrFailWithFilters() {
    const getCollectionWithFilters = this.getCollectionWithFilters.bind(this);
    return async (filters: IFlowStepFilters): Promise<IFlowStep & ISaved> => {
      const collection = await getCollectionWithFilters(filters);
      if (collection.size === 1) {
        return collection.values().next().value as IFlowStep & ISaved;
      } else if (collection.size === 0) {
        throw new EntityDoesNotExistError(
          EntityType.FlowStep,
          filters.regexp?.toString() || '',
        );
      } else {
        throw new EntityIsNotUniqueError(
          EntityType.FlowStep,
          filters.regexp?.toString() || '',
        );
      }
    };
  }

  public get getCollectionWithFilters() {
    const getCollectionByRegExp = this.getCollectionByRegExp.bind(this);
    const list = this.list.bind(this);
    const filterByRegExp = this.entity.filterByRegExp.bind(this);
    const filterCollection = this.entity.filterCollection.bind(this);
    return async ({ flow, regexp }: IFlowStepFilters) => {
      let entities: EntityCollection<IFlowStep & ISaved>;

      // get minimal superset
      if (flow !== undefined) {
        entities = flow.steps;
      } else if (regexp !== undefined) {
        entities = await getCollectionByRegExp(regexp);
      } else {
        entities = await list();
      }

      // filter
      if (flow !== undefined) {
        entities = await filterCollection<IFlowStep & ISaved>(({ id }) =>
          flow.steps.has(id),
        )(entities);
      }
      if (regexp !== undefined) {
        entities = await filterByRegExp(regexp)(entities);
      }

      // return
      return entities;
    };
  }
}

export type TFlowStepOperators = FlowStepOperators;
