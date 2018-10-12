import {TQueryColumns, ColumnSet} from 'pg-promise';

export interface ColumnValueFunction<T, ReturnT> {
  (obj: Partial<T>, columnProp: string): ReturnT|Promise<ReturnT>;
}

export interface ColumnDefinition<T, K extends keyof T> {
  name: string;
  value: ColumnValueFunction<T, T[K]>|T[K];
  prop?: string;
}

export interface ColumnDefinitions<T> extends
    Array<ColumnDefinition<T, keyof T>> {}

//   ColumnDefinition<T, keyof T>;
// }

export interface TableDefinition<T> {
  tableName: string;
  columnValues: ColumnDefinitions<T>;
  columnSet: ColumnSet;
}

export interface TableDefinitions {
  [index: string]: TableDefinition<any>;
}

export interface InsertFunctionCallback<T> {
  <K extends T>(row: K): void;
  // or more strictly...
  // (row: T): void;
}

export interface BatchInsertFunction<T> {
  (data: T|T[]): Promise<void>;
}

export interface BatchObject<T> {
  begin: number;
  end: number;
  batchIndex?: number;
  insertFunction: BatchInsertFunction<T>;
}
