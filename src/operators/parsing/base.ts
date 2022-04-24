import chalk from 'chalk';
import { inject, injectable } from 'inversify';
import { entityIsSaved, IEntity, IFlowStep, ISaved } from 'todo-manager';
import { TConfigurationOperators } from '../configuration';
import { Identificators } from '../../identificators';
import { TItemParser, TLenItemParser } from '../../models';
import { asyncQueuedMap, StringUtils } from '../../lib';
import { TLoggingOperators } from '../logging';

@injectable()
export class ParserBaseOperators {
  public constructor(
    @inject(Identificators.ConfigurationOperators)
    protected config: TConfigurationOperators,
    @inject(Identificators.LoggingOperators)
    protected logging: TLoggingOperators,
  ) {}

  public get len() {
    return (str: string) => String.raw`${str}`.length;
  }

  public get isColorAllowed() {
    const getConfiguration = this.config.getConfiguration.bind(this.config);
    return async (allowColor: boolean | undefined) => {
      if (allowColor !== undefined) {
        return allowColor;
      }
      const configuration = await getConfiguration();
      return configuration.view.allowColor;
    };
  }

  public get setColor() {
    return (color: IFlowStep['color'] | undefined) => {
      if (color === undefined) {
        return (str: string) => str;
      } else if (color === 'black') {
        return chalk.black;
      } else if (color === 'red') {
        return chalk.red;
      } else if (color === 'green') {
        return chalk.green;
      } else if (color === 'yellow') {
        return chalk.yellow;
      } else if (color === 'blue') {
        return chalk.blue;
      } else if (color === 'magenta') {
        return chalk.magenta;
      } else if (color === 'cyan') {
        return chalk.cyan;
      } else if (color === 'white') {
        return chalk.white;
      } else if (color === 'grey') {
        return chalk.grey;
      } else if (color === 'redBright') {
        return chalk.redBright;
      } else if (color === 'greenBright') {
        return chalk.greenBright;
      } else if (color === 'yellowBright') {
        return chalk.yellowBright;
      } else if (color === 'blueBright') {
        return chalk.blueBright;
      } else if (color === 'magentaBright') {
        return chalk.magentaBright;
      } else if (color === 'cyanBright') {
        return chalk.cyanBright;
      } else if (color === 'whiteBright') {
        return chalk.whiteBright;
      }
      return (str: string) => str;
    };
  }

  public get lengthOf() {
    const len = this.len.bind(this);
    return <T extends any = any>(fn: TItemParser<T>): TLenItemParser<T> => {
      return (options) => async (obj: T) =>
        len(await fn({ ...options, allowColor: false })(obj));
    };
  }

  public get minimalLengthOf() {
    const len = this.len.bind(this);
    return <T extends any = any>(fn: TItemParser<T>): TLenItemParser<T> => {
      return ({ shrinkable = false, ...options } = {}) =>
        async (obj: T) => {
          let length = len(await fn({ ...options, allowColor: false })(obj));
          if (shrinkable) {
            const { shrinkableMin = 0, shrinkStr = '' } = options;
            if (shrinkableMin === 0) {
              return 0;
            }
            length = Math.min(length, shrinkableMin + len(shrinkStr));
          }
          return length;
        };
    };
  }

  public get getMaxLength() {
    const lengthOf = this.lengthOf.bind(this);
    return <T extends any>(fn: TItemParser<T>): TLenItemParser<Iterable<T>> => {
      const len = lengthOf(fn);
      return (options) => async (items) => {
        return (
          await asyncQueuedMap((item: T) => len(options)(item))(items)
        ).reduce((a, b) => Math.max(a, b), 0);
      };
    };
  }

  public get getMinimalLength() {
    const lengthOf = this.minimalLengthOf.bind(this);
    return <T extends any>(fn: TItemParser<T>): TLenItemParser<Iterable<T>> => {
      const len = lengthOf(fn);
      return (options) => async (items) => {
        return (
          await asyncQueuedMap((item: T) => len(options)(item))(items)
        ).reduce((a, b) => Math.max(a, b), 0);
      };
    };
  }

  public get getMaxDateLength() {
    const getMaxLength = this.getMaxLength.bind(this);
    const parseDate = this.parseDate.bind(this);
    return getMaxLength(parseDate);
  }

  public get getMaxEntityDateLength() {
    const getMaxLength = this.getMaxLength.bind(this);
    const parseEntityDate = this.parseEntityDate.bind(this);
    return getMaxLength(parseEntityDate);
  }

  public get getMaxIdLength() {
    const getMaxLength = this.getMaxLength.bind(this);
    const parseId = this.parseId.bind(this);
    return getMaxLength(parseId);
  }

  public get getMaxNameLength() {
    const getMaxLength = this.getMaxLength.bind(this);
    const parseName = this.parseName.bind(this);
    return getMaxLength(parseName);
  }

  /**
   * Parsers
   */

  public get parseDate(): TItemParser<Date> {
    const getSelf = () => this.parseDate.bind(this);
    return ({ width, align = 'left', ...opts } = {}) =>
      async (date) => {
        if (width !== undefined) {
          return StringUtils.align(width, align)(await getSelf()(opts)(date));
        }
        let result = '';
        const timeDiff = Date.now() - date.getTime();
        const timeDiffAbs = Math.abs(timeDiff);
        const seconds = Math.floor(timeDiffAbs / 1000);
        if (timeDiff < -10000) {
          result += `in `;
        }
        if (timeDiffAbs < 10000) {
          result += `now`;
        } else if (seconds < 60) {
          result += `${seconds} sec`;
        } else if (seconds < 60 * 60) {
          const minutes = Math.floor(seconds / 60);
          result += `${minutes} min`;
        } else if (seconds < 60 * 60 * 2) {
          result += `one hour`;
        } else if (seconds < 60 * 60 * 24) {
          const hours = Math.floor(seconds / 60 / 60);
          result += `${hours} hours`;
        } else if (seconds < 60 * 60 * 24 * 2) {
          result += `one day`;
        } else if (seconds < 60 * 60 * 24 * 15) {
          const days = Math.floor(seconds / 60 / 60 / 24);
          result += `${days} days`;
        } else if (seconds < 60 * 60 * 24 * 365) {
          const weeks = Math.floor(seconds / 60 / 60 / 24 / 7);
          result += `${weeks} weeks`;
        } else {
          const secInAYear = 60 * 60 * 24 * 365;
          const years = Math.floor(seconds / secInAYear);
          const months = Math.floor((seconds - secInAYear) / 60 / 60 / 24 / 30);
          if (years === 1) {
            result += `one year`;
          } else {
            result += `${years} years`;
          }
          if (months > 2) {
            result += `${months} months`;
          } else if (months === 1) {
            result += `one month`;
          }
        }
        if (timeDiff > 10000) {
          result += ` ago`;
        }
        return result;
      };
  }

  public get parseName(): TItemParser<IEntity> {
    const len = this.len.bind(this);
    return ({ width, align = 'left', shrinkable, shrinkStr = '' } = {}) =>
      async (entity) => {
        let result = `${entity.name}`;
        let resultLen = len(result);
        if (width === undefined) {
          // Do nothing
        } else if (resultLen <= width) {
          result = StringUtils.align(width, align)(result);
        } else if (shrinkable) {
          result = result.substring(0, width - len(shrinkStr)) + shrinkStr;
          result = result.substring(0, width);
        }
        return result;
      };
  }

  public get parseEntityDate(): TItemParser<IEntity> {
    const parseDate = this.parseDate.bind(this);
    const isColorAllowed = this.isColorAllowed.bind(this);
    const setColor = this.setColor.bind(this);
    const len = this.len.bind(this);
    return ({
        width,
        align = 'left',
        allowColor,
        shrinkable,
        shrinkStr = '',
      } = {}) =>
      async (entity) => {
        let result = ``;
        if (!entityIsSaved(entity)) {
          result = `Not saved yet.`;
        } else if (entity.updatedAt) {
          result = `Updated ${await parseDate({})(entity.updatedAt)}`;
        } else {
          result = `Created ${await parseDate({})(entity.createdAt)}`;
        }
        let resultLen = len(result);
        if (width === undefined) {
          // Do nothing
        } else if (resultLen <= width) {
          result = StringUtils.align(width, align)(result);
        } else if (shrinkable) {
          result = result.substring(0, width - len(shrinkStr)) + shrinkStr;
          result = result.substring(0, width);
        }
        if (await isColorAllowed(allowColor)) {
          result = setColor(`grey`)(result);
        }
        return result;
      };
  }

  public get parseId(): TItemParser<IEntity & ISaved> {
    const isColorAllowed = this.isColorAllowed.bind(this);
    const setColor = this.setColor.bind(this);
    const len = this.len.bind(this);
    return ({
        width,
        align = 'left',
        allowColor,
        shrinkable,
        shrinkStr = '',
      } = {}) =>
      async (entity) => {
        let result = '';
        result = String(entity.id);
        let resultLen = len(result);
        if (width === undefined) {
          // Do nothing
        } else if (resultLen <= width) {
          result = StringUtils.align(width, align)(result);
        } else if (shrinkable) {
          result = result.substring(0, width - len(shrinkStr)) + shrinkStr;
          result = result.substring(0, width);
        }
        if (await isColorAllowed(allowColor)) {
          result = setColor(`grey`)(result);
        }
        return result;
      };
  }

  public get parseTitle(): TItemParser<string> {
    const isColorAllowed = this.isColorAllowed.bind(this);
    const setColor = this.setColor.bind(this);
    const hrChar = '─';
    return ({ width, align = 'left', allowColor } = {}) =>
      async (title) => {
        let result = '';
        const titleLength = title.length;
        if (width !== undefined) {
          result = StringUtils.align(width, align)(title);
          result +=
            `\n` +
            StringUtils.align(
              width,
              align,
            )(StringUtils.repeatUntilLength(hrChar)(titleLength));
        } else {
          result = title;
          result += `\n` + StringUtils.repeatUntilLength(hrChar)(titleLength);
        }
        if (await isColorAllowed(allowColor)) {
          result = setColor('whiteBright')(result);
        }
        return result;
      };
  }
}

export type TParserBaseOperators = ParserBaseOperators;
