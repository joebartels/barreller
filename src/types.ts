import {TQueryColumns} from 'pg-promise';

export interface ColumnValueFunction<T, ReturnT> {
  (obj: T): ReturnT;
}

export interface ColumnDefinition<T = {}, ReturnT = any> {
  name: string;
  value: ColumnValueFunction<T, ReturnT>|ReturnT;
  prop?: string;
}

export interface TableDefinition {
  tableName: string;
  columnValues: ColumnDefinition[];
  columnSet: TQueryColumns;
}

export interface BatchInsertFunction {
  (): Promise<void>;
}

export interface BatchObject {
  begin: number;
  end: number;
  batchIndex?: number;
  insertFunction: () => Promise<void>;
}
