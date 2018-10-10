import * as assertModule from 'assert';
import * as pgp from 'pg-promise';
import {TConnectionParameters} from 'pg-promise/typescript/pg-subset';

import {ColumnDefinition, TableDefinition, BatchObject, BatchInsertFunction} from './types';

const assert = assertModule.strict;
const hasOwnProperty = Object.prototype.hasOwnProperty;

export class Barrel {
  tables: {[key: string]: TableDefinition} = {};
  batches: BatchObject[] = [];
  // rows: any[] = [];
  rows: Array<{} > = [];

  readonly pgp: pgp.IMain;
  readonly db: pgp.IDatabase<any>;  // tslint:disable-line no-any

  constructor(connect: TConnectionParameters) {
    this.pgp = pgp();
    this.db = this.pgp(connect);
  }

  addTable(this: Barrel, tableName: string, columnValues: ColumnDefinition[]):
      void {
    const {pgp: {helpers}} = this;
    const queryColumns = columnValues.map(column => {
      const queryColumn: pgp.TColumnConfig = {name: column.name};

      if (hasOwnProperty.call(column, 'prop')) {
        queryColumn.prop = column.prop;
      }

      return queryColumn;
    });

    const columnSet =
        new helpers.ColumnSet(queryColumns, {table: {table: tableName}});

    this.tables[tableName] = {tableName, columnValues, columnSet};
  }

  generateRow<T, TOverrides = {[index:string]: any}>(
      this: Barrel, tableName: string, overrides?: TOverrides): T {
    const { rows, batches } = this;
    let data;

    data = this.createRowObject<T>(tableName, overrides);
    // data = this.createRowObject<T>(tableName);
    // if (overrides) {
    // } else  {
    // }

    // const data = this.createRowObject<RowObject, RowObjectOverrides>(tableName, overrides);
    const insertFunction = this.createInsertFunction(tableName, data);
    const rowIndex = rows.push(data) - 1;

    const batchData: BatchObject = {
      begin: rowIndex,
      end: rowIndex + 1,
      insertFunction
    };

    const batchIndex = batches.push(batchData) - 1;

    batchData.batchIndex = batchIndex;

    return data;
  }

  /**
   * Given a `tableName`, a row-object is created using the `columnValues`
   * provided to `addTable(tableName, columnValues)`.
   *
   * @method createRowObject
   * @param tableName {string}
   * @param overrides {object}
   */
  createRowObject<T>(
      this: Barrel, tableName: string, overrides?: {[index:string]: any}): T {
    const hash: {[key:string]: any} = {};
    const table: TableDefinition = this.tables[tableName];

    assert.ok(
        table,
        `Table name ${tableName} does not exist. You must first addTable(${tableName}, columnValues)`);

    const {columnValues} = table;

    const reducer = (obj: typeof hash, column: ColumnDefinition<T>) => {
      let key;

      if (column.prop && hasOwnProperty.call(column, 'prop')) {
        key = column.prop;
      } else {
        key = column.name;
      }

      if (overrides && hasOwnProperty.call(overrides, key)) {
        obj[key] = overrides[key];
      } else {
        obj[key] = Barrel._returnValue(column.value, obj);
      }

      return obj;
    };

    // return Object.assign(rowObject = {}, hash);

    // return rowObject;
    return columnValues.reduce(reducer, hash) as T;
  }

  /**
   * @method createInsertFunction
   * @param tableName
   * @param data
   * @param callback Optional. When provided, the inserted row is passed into the callback as the first parameter.
   * @returns An async function that inserts the row into the database.
   * @private
   */
  private createInsertFunction<RowObject>(
    this: Barrel,
    tableName: string,
    data: {},
    callback?: (value: RowObject) => void
  ): BatchInsertFunction {
    const {tables, db, pgp: {helpers}} = this;
    const table: TableDefinition = tables[tableName];

    assert.ok(
        table,
        `Table name ${tableName} does not exist. You must first addTable(${tableName}, columnValues)`);

    const {columnSet} = table;

    const insert = helpers.insert(data, columnSet);

    return async () => {
      await db.task(`INSERT INTO "${tableName}"`, async t => {

        try {
          if (callback && typeof callback === 'function') {
            const insertedRow = await t.one(insert);

            await callback(insertedRow);
          } else {
            await t.none(insert);
          }
        } catch(err) {
          throw new Error(err);
        }

      });
    };
  }

  static _returnValue<ReturnType, AdditionalOptions>(
      value: ReturnType, ...params: AdditionalOptions[]) {
    if (typeof value === 'function') {
      return value(...params);
    }

    return value;
  }
}
