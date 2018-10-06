import test from 'ava';
import {lorem, random} from 'faker';
import {TQueryColumns} from 'pg-promise';

import {Barrel} from '../src/barreller';
import {ColumnDefinition, ColumnsDefinition} from '../src/types';

test('barrel.addTable()', t => {
  const barrel = new Barrel({});

  const columnValues: ColumnsDefinition = [
    {
      name: 'food_id',
      value() {
        return random.uuid();
      }
    },
    {
      name: 'name',
      value() {
        return lorem.word();
      }
    },
    {name: 'supplier', value: 'acme inc.'}
  ];

  const columnSet: TQueryColumns =
      [{name: 'food_id', prop: 'foodId'}, {name: 'name'}, {name: 'supplier'}];

  barrel.addTable('food', columnValues);

  const table = barrel.tables['food'];

  t.is(table.tableName, 'food');

  return barrel.pgp.end();
});

test('barrel.generateRow() creates a RowObject', t => {
  const barrel = new Barrel({});
  const uuid = 'b9bf40aa-5908-4210-a97e-162ca9bb470f';

  const columnValues: ColumnsDefinition = [
    {
      name: 'food_id',
      prop: 'foodId',
      value() {
        return random.uuid();
      }
    },
    {
      name: 'calories',
      value() {
        return random.number();
      }
    },
    {
      name: 'supplier',
      value: 'acme inc.'
    }
  ];

  barrel.addTable('food', columnValues);

  const foodRow = barrel.generateRow<{foodId: string, calories: number, supplier: string}>('food');

  console.log(foodRow);

  t.is(foodRow.foodId.length, uuid.length);
  t.is(typeof foodRow.calories, 'number');
  t.is(foodRow.supplier, 'acme inc.');

  return barrel.pgp.end();
});
