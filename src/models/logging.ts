export enum LogType {
  StartOperation = 'Start Operation',
  EndOperation = 'End Operation',
  Message = 'Message',
}

export interface IStartOperationLog {
  type: LogType.StartOperation;
  timestamp: Date;
  eventId: number;
  depth: number;
  label: string;
}

export interface IEndOperationLog {
  type: LogType.EndOperation;
  timestamp: Date;
  eventId: number;
  depth: number;
  label: string;
}

export interface IMessageLog {
  type: LogType.Message;
  timestamp: Date;
  depth: number;
  data?: any;
}

export type TLog = IStartOperationLog | IEndOperationLog | IMessageLog;
