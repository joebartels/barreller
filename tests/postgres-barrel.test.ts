import test from 'ava';
import * as promise from 'bluebird';
import { lorem, random } from 'faker';
import { TQueryColumns } from 'pg-promise';

import { PostgresBarrel } from '../src/postgres-barrel';

function createBarrel() {
  // return new PostgresBarrel();
}

test.skip('barrel.addTable()', t => {
  // const barrel = createBarrel();

  // type FoodTable = { food_id: string; name: string; supplier: string; };

  // const columnFoodId: ColumnDefinition<FoodTable, 'food_id'> = {
  //   name: 'food_id',
  //   value() {
  //     return random.uuid();
  //   }
  // };

  // const columnName: ColumnDefinition<FoodTable, 'name'> = {
  //   name: 'name',
  //   value() {
  //     return lorem.word();
  //   }
  // };

  // const columnSupplier: ColumnDefinition<FoodTable, 'supplier'> = {
  //   name: 'supplier',
  //   value: 'acme inc.'
  // };

  // const columnValues: Array<ColumnDefinition<FoodTable, any>> =
  //     [columnFoodId, columnName, columnSupplier];

  // const columnSet: TQueryColumns =
  //     [{name: 'food_id', prop: 'foodId'}, {name: 'name'}, {name: 'supplier'}];

  // barrel.addTable<FoodTable>('food', columnValues);

  // const table = barrel.tables['food'];

  // t.is(table.tableName, 'food');

  // return barrel.pgp.end();
});
