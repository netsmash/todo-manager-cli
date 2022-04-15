import {
  Id,
  ISaved,
  IEntity,
  EntityOperators as EntityOperatorsBase,
  entityIsSaved,
  EntityCollection,
  MaybePromise,
} from 'todo-manager';
import { EntityDoesNotExistError, EntityIsNotUniqueError } from '../../errors';

export class EntityOperators extends EntityOperatorsBase {
  public get filterCollection() {
    return <E extends IEntity>(
        fn: (
          entity: E,
          id: Id,
          collection: EntityCollection<E>,
        ) => MaybePromise<boolean>,
      ) =>
      async (collection: EntityCollection<E>): Promise<EntityCollection<E>> => {
        const result: EntityCollection<E> = new Map();
        for (const [id, entity] of collection.entries()) {
          if (await fn(entity, id, collection)) {
            result.set(id, entity);
          }
        }
        return result;
      };
  }

  public get filterByRegExp() {
    const filter = this.filterCollection.bind(this);
    return (regexp: string | RegExp, flags = 'i') =>
      async <E extends IEntity>(
        collection: EntityCollection<E & ISaved>,
      ): Promise<EntityCollection<E & ISaved>> => {
        const re =
          typeof regexp === 'string' ? new RegExp(regexp, flags) : regexp;
        return await filter<E & ISaved>(
          ({ id, name }) => re.test(String(id)) || re.test(name),
        )(collection);
      };
  }

  public get getOrFailByRegExpFrom() {
    return <E extends IEntity>(type: E['type']) =>
      (regexp: string | RegExp, flags = 'i') =>
      async (collection: EntityCollection<E & ISaved>): Promise<E & ISaved> => {
        const re =
          typeof regexp === 'string' ? new RegExp(regexp, flags) : regexp;
        const matchedFromIds = Array.from(collection.values()).filter(
          ({ id }) => re.test(String(id)),
        );
        const matchedFromNames = Array.from(collection.values()).filter(
          ({ name }) => re.test(name),
        );
        if (matchedFromIds.length === 1) {
          return matchedFromIds[0] as E & ISaved;
        } else if (matchedFromNames.length === 1) {
          return matchedFromNames[0] as E & ISaved;
        } else if (
          matchedFromIds.length === 0 &&
          matchedFromNames.length === 0
        ) {
          throw new EntityDoesNotExistError(type, String(re));
        } else {
          throw new EntityIsNotUniqueError(type, String(re));
        }
      };
  }

  public get getOrFailByRegExp() {
    const getCollection = this.list.bind(this);
    const getOrFailByRegExpFrom = this.getOrFailByRegExpFrom.bind(this);
    return <E extends IEntity>(type: E['type']) =>
      async (regexp: string | RegExp, flags = 'i'): Promise<E & ISaved> => {
        const collection = (await getCollection(type)) as EntityCollection<
          E & ISaved
        >;
        return await getOrFailByRegExpFrom<E>(type)(regexp, flags)(collection);
      };
  }

  public get getCollectionByRegExp() {
    const getCollection = this.list.bind(this);
    const filterByRegExp = this.filterByRegExp.bind(this);
    return <E extends IEntity>(type: E['type']) =>
      async (
        regexp: string | RegExp,
        flags = 'i',
      ): Promise<EntityCollection<E & ISaved>> => {
        const collection = (await getCollection(type)) as EntityCollection<
          E & ISaved
        >;
        return await filterByRegExp(regexp, flags)(collection);
      };
  }

  public get compare() {
    const compareIds = (a: Id, b: Id): number =>
      typeof a === 'symbol' ? 0 : typeof b === 'symbol' ? 0 : a < b ? -1 : 1;
    return (a: IEntity, b: IEntity): number => {
      if (!entityIsSaved(a) && entityIsSaved(b)) {
        return 1;
      } else if (entityIsSaved(a) && !entityIsSaved(b)) {
        return -1;
      } else if (entityIsSaved(a) && entityIsSaved(b)) {
        const dateA = (a.updatedAt || a.createdAt).getTime();
        const dateB = (b.updatedAt || b.createdAt).getTime();
        if (dateA < dateB) {
          return -1;
        } else if (dateA > dateB) {
          return 1;
        }
        return compareIds(a.id, b.id);
      }
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    };
  }
}

export type TEntityOperators = EntityOperators;
