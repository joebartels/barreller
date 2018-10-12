import * as assertModule from 'assert';
import * as pgp from 'pg-promise';
import {TConnectionParameters} from 'pg-promise/typescript/pg-subset';

import {BatchInsertFunction, BatchObject, ColumnDefinition, ColumnDefinitions, InsertFunctionCallback, TableDefinition, TableDefinitions} from './types';

const assert = assertModule.strict;
const hasOwnProperty = Object.prototype.hasOwnProperty;

export abstract class Barrel {
  // extending class should be more specific with value's Type
  schemas: {[index:string]: any} = {};

  // each batch holds information for what data to add to database and a function for adding the data.
  batches: Array<BatchObject<any>> = [];

  // rows store the raw data (in memory for now)
  rows: Array<{}> = [];

  constructor() { }

  addSchema<T>(schemaName: string, schemaDefinition: T) {
    this.schemas[schemaName] = schemaDefinition;
  }

  generateRow<T>(
      this: Barrel,
      tableName: string,
      overrides?: Partial<T>,
      callback?: InsertFunctionCallback<T>
  ): T {
    const {rows, batches} = this;

    const data = this.createRowObject<T>(tableName, overrides);
    const insertFunction = this.createInsertFunction<T>(tableName, callback);
    const rowIndex = rows.push(data) - 1;

    const batchData:
        BatchObject<T> = {begin: rowIndex, end: rowIndex + 1, insertFunction};

    const batchIndex = batches.push(batchData) - 1;

    batchData.batchIndex = batchIndex;

    return data;
  }


  createRowObject<T>(
    this: Barrel,
    schemaName: string,
    properties?: {[index: string]: any}
  ): T {
    const hash: {[key: string]: any} = {};
    const table: TableDefinition<T> = this.schemas[schemaName];

    assert.ok(
        table,
        `Schema name ${schemaName} does not exist. You must first addSchema(${
            schemaName}, schemaDefinition)`);

    const {columnValues} = table;

    const reducer = (obj: typeof hash, column: ColumnDefinition<T, any>) => {
      let key;

      if (column.prop && hasOwnProperty.call(column, 'prop')) {
        key = column.prop;
      } else {
        key = column.name;
      }

      if (properties && hasOwnProperty.call(properties, key)) {
        obj[key] = properties[key];
      } else {
        obj[key] = Barrel._returnValue.call(this, column.value, obj, key);
      }

      return obj;
    };

    return columnValues.reduce(reducer, hash) as T;
  }

  abstract createInsertFunction<T>(
    schemaName: string,
    callback?: InsertFunctionCallback<T>
  ): BatchInsertFunction<T>;

  static _returnValue<ReturnType>(
      this: Barrel,
      value: ReturnType, ...params: any[]) {
    if (typeof value === 'function') {
      return value.call(this, ...params);
    }

    return value;
  }
}
