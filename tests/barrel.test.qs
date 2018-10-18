import test from 'ava';
import {lorem, random} from 'faker';
import {Barrel} from '../src/barreller';

import {TQueryColumns} from 'pg-promise';
import {ColumnDefinition, ColumnDefinitions} from '../src/types';

test('barrel.addTable()', t => {
  const barrel = new Barrel({});

  type FoodTable = { food_id: string; name: string; supplier: string; };

  const columnFoodId: ColumnDefinition<FoodTable, 'food_id'> = {
    name: 'food_id',
    value() {
      return random.uuid();
    }
  };

  const columnName: ColumnDefinition<FoodTable, 'name'> = {
    name: 'name',
    value() {
      return lorem.word();
    }
  };

  const columnSupplier: ColumnDefinition<FoodTable, 'supplier'> = {
    name: 'supplier',
    value: 'acme inc.'
  };

  const columnValues: Array<ColumnDefinition<FoodTable, any>> =
      [columnFoodId, columnName, columnSupplier];

  const columnSet: TQueryColumns =
      [{name: 'food_id', prop: 'foodId'}, {name: 'name'}, {name: 'supplier'}];

  barrel.addTable<FoodTable>('food', columnValues);

  const table = barrel.tables['food'];

  t.is(table.tableName, 'food');

  return barrel.pgp.end();
});

test('barrel.generateRow() creates a RowObject', t => {
  const barrel = new Barrel({});
  const uuid = 'b9bf40aa-5908-4210-a97e-162ca9bb470f';

  type FoodTable = { foodId: string; calories: number; supplier: string; };

  const columnFoodId: ColumnDefinition<FoodTable, 'foodId'> = {
    name: 'food_id',
    prop: 'foodId',
    value() {
      return random.uuid();
    }
  };

  const columnCalories: ColumnDefinition<FoodTable, 'calories'> = {
    name: 'calories',
    value() {
      return random.number();
    }
  };

  const columnSupplier: ColumnDefinition<FoodTable, 'supplier'> = {
    name: 'supplier',
    value: 'acme inc.'
  };


  const columnValues: ColumnDefinitions<FoodTable> =
      [columnFoodId, columnCalories, columnSupplier];

  barrel.addTable('food', columnValues);

  const foodRow =
      barrel.generateRow<FoodTable>(
          'food');

  t.is(foodRow.foodId.length, uuid.length);
  t.is(typeof foodRow.calories, 'number');
  t.is(foodRow.supplier, 'acme inc.');

  return barrel.pgp.end();
});

test(
    'barrel.generateRow() passes a partial RowObject to the value() function', t => {
      t.plan(6);

      type FoodTable = { foodId: string; calories: number; vitamins: string[]; };

      const barrel = new Barrel({});
      const foodId = 'this-is-a-food-id';
      const calories = 120;
      const vitamins = ['A', 'B', 'C'];

      const columnFoodId: ColumnDefinition<FoodTable, 'foodId'> = {
        name: 'food_id',
        prop: 'foodId',
        value: foodId
      };

      const columnCalories: ColumnDefinition<FoodTable, 'calories'> = {
        name: 'calories',
        value(obj, currentKey) {
          t.is(obj.foodId, foodId);
          t.is(currentKey, 'calories');

          return calories;
        }
      };

      const columnVitamins: ColumnDefinition<FoodTable, 'vitamins'> = {
        name: 'vitamins',
        value(obj, currentKey) {
          t.is(obj.foodId, foodId);
          t.is(obj.calories, calories);
          t.is(currentKey, 'vitamins');

          return vitamins;
        }
      };
      const columnValues: ColumnDefinitions<FoodTable> = [
        columnFoodId,
        columnCalories,
        columnVitamins
      ];

      barrel.addTable('food', columnValues);

      const foodRow = barrel.generateRow<FoodTable>('food');

      t.deepEqual(foodRow, {foodId, calories, vitamins});

      return barrel.pgp.end();
    });

test(
    'barrel.generateRow() queues a rows data into `rows` and `batches`',
    t => {
      type FoodTable = { foodId: string; };
      type IngredientTable = { ingredientId: string; };

      const barrel = new Barrel({});
      const foodId = 'this-is-a-food-id';
      const ingredientId = 'ingredient1';

      const columnFoodId: ColumnDefinition<FoodTable, 'foodId'> = {
        name: 'food_id',
        prop: 'foodId',
        value: foodId
      };

      const columnValuesForFood: ColumnDefinitions<FoodTable> = [
        columnFoodId
      ];

      const columnIngredientId: ColumnDefinition<IngredientTable, 'ingredientId'> = {
        name: 'ingredient_id',
        prop: 'ingredientId',
        value: ingredientId
      };

      const columnValuesForIngredient: ColumnDefinitions<IngredientTable> = [
        columnIngredientId
      ];

      barrel.addTable('food', columnValuesForFood);
      barrel.addTable('ingredient', columnValuesForIngredient);

      t.is(barrel.rows.length, 0);
      t.is(barrel.batches.length, 0);

      const foodRow = barrel.generateRow<FoodTable>('food');

      t.is(barrel.rows.length, 1);
      t.is(barrel.batches.length, 1);
      t.deepEqual(foodRow, {foodId});

      const [queuedData1] = barrel.rows;
      const [queuedBatch1] = barrel.batches;

      t.deepEqual(queuedData1, {foodId});
      t.is(queuedBatch1.begin, 0);
      t.is(queuedBatch1.end, 1);
      t.is(queuedBatch1.batchIndex, 0);
      t.is(typeof queuedBatch1.insertFunction, 'function');

      const ingredientRow = barrel.generateRow<FoodTable>('ingredient');
      const [, queuedData2] = barrel.rows;
      const [, queuedBatch2] = barrel.batches;

      t.deepEqual(queuedData2, {ingredientId});
      t.is(queuedBatch2.batchIndex, 1);
      t.is(queuedBatch2.begin, 1);
      t.is(queuedBatch2.end, 2);
      t.is(typeof queuedBatch2.insertFunction, 'function');

      return barrel.pgp.end();
    }
  );

// test('barrel.generateRow() with references', async t => {
//   const barrel = new Barrel({});

//   barrel.

// });
