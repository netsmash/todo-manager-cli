import { injectable } from 'inversify';
import { MaybePromise } from 'todo-manager';
import {
  IEndOperationLog,
  IMessageLog,
  IStartOperationLog,
  LogType,
  TLog,
} from '../models';

//type Sync<T> = T extends Promise<infer I> ? I : T;
type FM<A extends any[], B> = (...args: A) => B;

interface IParseRegisterProps {
  collapse?: (log: IStartOperationLog) => boolean;
}

@injectable()
export class LoggingOperators {
  protected deep: number = 0;
  public get getDeep() {
    const self = this;
    return () => self.deep;
  }

  public get setDeep() {
    const self = this;
    return (value: number) => {
      self.deep = value;
    };
  }

  public get goDeep() {
    const self = this;
    return (value: number = 1) => {
      self.deep += value;
    };
  }

  public get backDeep() {
    const self = this;
    return (value: number = 1) => {
      self.deep -= value;
    };
  }

  protected register: TLog[] = [];

  public get registerMessage() {
    const register = this.register;
    const getDeep = this.getDeep.bind(this);
    return (log: Omit<IMessageLog, 'type' | 'timestamp' | 'depth'>) => {
      const completeLog: IMessageLog = {
        ...log,
        type: LogType.Message,
        timestamp: new Date(),
        depth: getDeep(),
      };
      register.push(completeLog);
      return completeLog;
    };
  }

  public get registerStartOperation() {
    const register = this.register;
    const getDeep = this.getDeep.bind(this);
    return (log: Omit<IStartOperationLog, 'type' | 'timestamp' | 'depth'>) => {
      const completeLog: IStartOperationLog = {
        ...log,
        type: LogType.StartOperation,
        timestamp: new Date(),
        depth: getDeep(),
      };
      register.push(completeLog);
      return completeLog;
    };
  }

  public get registerEndOperation() {
    const register = this.register;
    const getDeep = this.getDeep.bind(this);
    return (log: Omit<IEndOperationLog, 'type' | 'timestamp' | 'depth'>) => {
      const completeLog: IEndOperationLog = {
        ...log,
        type: LogType.EndOperation,
        timestamp: new Date(),
        depth: getDeep(),
      };
      register.push(completeLog);
      return completeLog;
    };
  }

  public get parseRegister() {
    const register = this.register;
    const parseIndent = (depth: number) => `  `.repeat(depth);
    const getRegisterTime = this.getRegisterTime.bind(this);
    return ({ collapse = () => false }: IParseRegisterProps = {}) => {
      let result = ``;
      const logLines: string[] = [];
      for (let i = 0; i < register.length; i++) {
        const log = register[i] as TLog;
        let logLine = ``;
        logLine += `[${log.timestamp.getTime()}]  `;
        logLine += `${i.toString().padStart(6, '0')} `;
        logLine += parseIndent(log.depth);
        if (log.type === LogType.StartOperation) {
          if (collapse(log)) {
            let exitLoop = false;
            const currentIndex = i;
            for (let j = i + 1; !exitLoop && j < register.length; j++, i++) {
              const nextLog = register[j] as TLog;
              exitLoop =
                nextLog.type === LogType.EndOperation &&
                log.eventId === nextLog.eventId;
            }
            logLine += `<+${i - currentIndex}> (${log.eventId}) ${log.label}`;
          } else {
            const j = i + 1;
            const nextLog = register[j] as TLog;
            if (
              nextLog.type === LogType.EndOperation &&
              log.eventId === nextLog.eventId
            ) {
              logLine += `<> (${log.eventId}) ${log.label}`;
              i++;
            } else {
              logLine += `-> (${log.eventId}) ${log.label}`;
            }
          }
        } else if (log.type === LogType.EndOperation) {
          logLine += `<- (${log.eventId}) ${log.label}`;
        } else if (log.type === LogType.Message) {
          logLine += `| ${String(log.data)}`;
        }
        logLines.push(logLine);
      }
      result += logLines.join(`\n`);
      if (register.length > 1) {
        const diff = getRegisterTime();
        result += `\nFrom first to last logs has past ${diff}ms`;
      }
      return result;
    };
  }

  public get getRegisterTime() {
    const register = this.register;
    return (start?: number, end?: number) => {
      if (register.length < 2) {
        return 0;
      }
      start = start ?? 0;
      end = end ?? register.length;
      const first = register[start] as TLog;
      const last = register[end - 1] as TLog;
      const diff = last.timestamp.getTime() - first.timestamp.getTime();
      return diff;
    };
  }

  public get createEventId() {
    const register = this.register;
    return (_: string) => register.length;
  }

  public get logOperation() {
    const createEventId = this.createEventId.bind(this);
    const registerStart = this.registerStartOperation.bind(this);
    const registerEnd = this.registerEndOperation.bind(this);
    const goDeep = this.goDeep.bind(this);
    const backDeep = this.backDeep.bind(this);
    return (label: string) =>
      <A extends any[], B>(fn: FM<A, B>) =>
      (...args: A) => {
        const eventId = createEventId(label);
        registerStart({ label, eventId });
        goDeep();
        const result = fn(...args);
        backDeep();
        registerEnd({ label, eventId });
        return result;
      };
  }

  public get logAsyncOperation() {
    const createEventId = this.createEventId.bind(this);
    const registerStart = this.registerStartOperation.bind(this);
    const registerEnd = this.registerEndOperation.bind(this);
    const goDeep = this.goDeep.bind(this);
    const backDeep = this.backDeep.bind(this);
    return (label: string) =>
      <A extends any[], B>(fn: FM<A, MaybePromise<B>>) =>
      async (...args: A) => {
        const eventId = createEventId(label);
        registerStart({ label, eventId });
        goDeep();
        const result = await fn(...args);
        backDeep();
        registerEnd({ label, eventId });
        return result;
      };
  }

  public get message() {
    const registerMessage = this.registerMessage.bind(this);
    return (...data: any[]) => {
      registerMessage({ data });
    };
  }
}
export type TLoggingOperators = LoggingOperators;
