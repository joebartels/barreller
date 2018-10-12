import test from 'ava';
import {random} from 'faker';
import {Barrel} from '../src/barreller';
import {init, teardown, connectionOptions} from './db/pg';
import { ColumnDefinitions, ColumnDefinition } from '../src/types';

type FoodTable = {
  foodId: string;
  name: string;
  calories: number;
  vitamins: string[];
};

type IngredientTable = {
  ingredientId: string;
  name: string;
};

type FoodIngredientTable = {
  foodId: string;
  ingredientId: string;
  milligrams: number;
};

test.only('`barrel.insert()` inserts data into database', async t => {
  const barrel = new Barrel(connectionOptions());

  await init(barrel.db);
  const calories = 100;
  const foodId1 = random.uuid();
  const foodId2 = random.uuid();
  const foodIds = [
    foodId1,
    foodId2
  ];

  const columnFoodId: ColumnDefinition<FoodTable, 'foodId'> = {
    name: 'food_id',
    prop: 'foodId',
    value() { return foodIds.shift() || ''; }
  };

  const columnCalories: ColumnDefinition<FoodTable, 'calories'> = {
    name: 'calories',
    value: calories
  };

  const columns: ColumnDefinitions<FoodTable> = [
    columnFoodId,
    columnCalories
  ];

  barrel.addTable<FoodTable>('food', columns);
  barrel.generateRow<FoodTable>('food');

  const earlyResults = await barrel.db.manyOrNone('SELECT * FROM FOOD');

  t.is(earlyResults.length, 0);

  await barrel.insert();

  const results1 = await barrel.db.manyOrNone('SELECT * FROM FOOD');
  const [actual] = results1;

  const expected1 = {
    food_id: foodId1,
    calories,
    name: null,
    vitamins: null
  };

  t.is(results1.length, 1);
  t.deepEqual(actual, expected1);

  // generate more food
  barrel.generateRow<FoodTable>('food');

  await barrel.insert();

  const results2 = await barrel.db.manyOrNone('SELECT * FROM FOOD');
  const [actual1, actual2] = results2;

  const expected2 = {
    food_id: foodId2,
    calories,
    name: null,
    vitamins: null
  };

  t.is(results2.length, 2);
  t.deepEqual(actual1, expected1);
  t.deepEqual(actual2, expected2);

  await teardown(barrel.db);
});


test.only('`barrel.insert()` inserts references into database', async t => {
  const barrel = new Barrel(connectionOptions());

  await init(barrel.db);
  const foodId = random.uuid();
  const ingredientId = random.uuid();

  const foodColumnFoodId: ColumnDefinition<FoodTable, 'foodId'> = {
    name: 'food_id',
    prop: 'foodId',
    value: foodId
  };

  const ingredientColumnIngredientId: ColumnDefinition<IngredientTable, 'ingredientId'> = {
    name: 'ingredient_id',
    prop: 'ingredientId',
    value: ingredientId
  };

  const foodIngredientColumnFoodId: ColumnDefinition<FoodIngredientTable, 'foodId'> = {
    name: 'food_id',
    prop: 'foodId',
    value: Barrel.references('food', 'food_id')
  };

  const foodIngredientColumnIngredientId: ColumnDefinition<FoodIngredientTable, 'foodId'> = {
    name: 'ingredient_id',
    prop: 'ingredientId',
    value: Barrel.references('ingredient', 'ingredient_id')
  };

  const foodColumns: ColumnDefinitions<FoodTable> = [
    foodColumnFoodId
  ];

  const ingredientColumns: ColumnDefinitions<IngredientTable> = [
    ingredientColumnIngredientId
  ];

  const foodIngredientColumns: ColumnDefinitions<FoodIngredientTable> = [
    foodIngredientColumnFoodId,
    foodIngredientColumnIngredientId
  ];

  barrel.addTable<FoodTable>('food', foodColumns);
  barrel.addTable<IngredientTable>('ingredient', ingredientColumns);
  barrel.addTable<FoodIngredientTable>('food_ingredient', foodIngredientColumns);
  barrel.generateRow<FoodIngredientTable>('food_ingredient');

  const [
    existingFoods,
    existingIngredients,
    existingFoodIngredients
  ] = await Promise.all([
    barrel.db.manyOrNone('SELECT * FROM food'),
    barrel.db.manyOrNone('SELECT * FROM ingredient'),
    barrel.db.manyOrNone('SELECT * FROM food_ingredient'),
  ]);

  t.is(existingFoods.length, 0);
  t.is(existingIngredients.length, 0);
  t.is(existingFoodIngredients.length, 0);

  await barrel.insert();

  const foods = await barrel.db.manyOrNone('SELECT * FROM food');
  const ingredients = await barrel.db.manyOrNone('SELECT * FROM ingredient');
  const foodIngredients = await barrel.db.manyOrNone('SELECT * FROM food_ingredient');

  console.log(foods);
  console.log(ingredients);
  console.log(foodIngredients);

  t.pass();
  // const results1 = await barrel.db.manyOrNone('SELECT * FROM FOOD');
  // const [actual] = results1;

  // const expected1 = {
  //   food_id: foodId1,
  //   calories,
  //   name: null,
  //   vitamins: null
  // };

  // t.is(results1.length, 1);
  // t.deepEqual(actual, expected1);

  // // generate more food
  // barrel.generateRow<FoodTable>('food');

  // await barrel.insert();

  // const results2 = await barrel.db.manyOrNone('SELECT * FROM FOOD');
  // const [actual1, actual2] = results2;

  // const expected2 = {
  //   food_id: foodId2,
  //   calories,
  //   name: null,
  //   vitamins: null
  // };

  // t.is(results2.length, 2);
  // t.deepEqual(actual1, expected1);
  // t.deepEqual(actual2, expected2);

  await teardown(barrel.db);
});
