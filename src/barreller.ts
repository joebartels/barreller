import * as assertModule from 'assert';
import * as pgp from 'pg-promise';
import {TQueryColumns} from 'pg-promise';
import {TConnectionParameters} from 'pg-promise/typescript/pg-subset';

import {ColumnDefinition, ColumnsDefinition, RowObject, TableDefinition} from './types';
import { AssertionError } from 'assert';

const assert = assertModule.strict;
const hasOwnProperty = Object.prototype.hasOwnProperty;

export class Barrel {
  tables: {[key: string]: TableDefinition} = {};
  readonly pgp: pgp.IMain;
  readonly db: pgp.IDatabase<any>;  // tslint:disable-line no-any

  constructor(connect: TConnectionParameters) {
    this.pgp = pgp();
    this.db = this.pgp(connect);
  }

  addTable(
      this: Barrel, tableName: string,
      columnValues: ColumnsDefinition
  ): void {
    const { pgp: { helpers } } = this;
    const queryColumns = columnValues.map(column => {
      const queryColumn: pgp.TColumnConfig = {
        name: column.name
      };

      if (hasOwnProperty.call(column, 'prop')) {
        queryColumn.prop = column.prop;
      }

      return queryColumn;
    });

    const columnSet = new helpers.ColumnSet(
      queryColumns,
      {table: {table: tableName}}
    );

    this.tables[tableName] = {tableName, columnValues, columnSet};
  }

  generateRow<T = RowObject>(this: Barrel, tableName: string, overrides?: RowObject): T {
    const row: RowObject = Object.create(null);
    const table: TableDefinition = this.tables[tableName];

    assert.ok(table, `Table name ${tableName} does not exist. You must addTable() first.`);

    const {columnValues} = table;

    const reducer = (obj: RowObject, column: ColumnDefinition) => {
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

    return Object.freeze(columnValues.reduce(reducer, Object.create(null)));
  }

  static _returnValue<ReturnType, AdditionalOptions>(
      value: ReturnType, ...params: AdditionalOptions[]) {
    if (typeof value === 'function') {
      return value(...params);
    }

    return value;
  }
}
