import test from 'ava';
import * as promise from 'bluebird';
import { lorem, random } from 'faker';
import { TQueryColumns } from 'pg-promise';

import { Barrel, BatchInsertFunction, PropertyDefinition, PropertyDefinitions, SchemaDefinition, SchemaDefinitions } from '../src/barrel';

function createBarrel() {
  interface DinosaurSchema extends SchemaDefinition {
    dinosaurs: string;
  }

  class TestBarrel extends Barrel {
    schemas: SchemaDefinitions<DinosaurSchema> = {};
    createInsertFunction() { return async () => {}; }
  }

  return new TestBarrel();
}

test('Barrel._returnValue on static value', t => {
  const value = 'hi';
  const barrel = createBarrel();

  t.is(Barrel._returnValue.call(barrel, value), value);
});

test('Barrel._returnValue on function without params', t => {
  const value = 'hi';
  const valueFunction = () => value;
  const barrel = createBarrel();

  t.is(Barrel._returnValue.call(barrel, valueFunction), value);
});

test('Barrel._returnValue on function with params', t => {
  const valueFunction = (...params: any[]) => `params are ${params.join(',')}`;
  const barrel = createBarrel();

  t.is(
    Barrel._returnValue.call(barrel, valueFunction, 'a', 'b', 'c'),
    'params are a,b,c'
  );
});

test('barrel.addSchema()', t => {
  const barrel = createBarrel();

  const schema = {
    schemaName: 'food',
    properties: [],
    dinosaurs: 't-rex'
  };

  barrel.addSchema('food', schema);

  t.deepEqual(barrel.schemas['food'], schema);
});

test('barrel.createDataObject() creates a DataObject', async t => {
  const barrel = createBarrel();

  const uuid = 'b9bf40aa-5908-4210-a97e-162ca9bb470f';

  type FoodTable = { foodId: string; calories: number; supplier: string; };

  // function value
  const columnFoodId: PropertyDefinition<FoodTable, 'foodId'> = {
    name: 'food_id',
    prop: 'foodId',
    value() {
      return random.uuid();
    }
  };

  // promise value
  const columnCalories: PropertyDefinition<FoodTable, 'calories'> = {
    name: 'calories',
    value() {
      return Promise.resolve(random.number());
    }
  };

  // static value
  const foodSupplier = 'acme inc.';
  const columnSupplier: PropertyDefinition<FoodTable, 'supplier'> = {
    name: 'supplier',
    value: foodSupplier
  };

  const properties: PropertyDefinitions<FoodTable> = [
    columnFoodId,
    columnCalories,
    columnSupplier
  ];

  const foodSchema = {
    schemaName: 'food',
    properties
  };

  barrel.addSchema('food', foodSchema);

  const foodData = barrel.createDataObject<FoodTable>('food');

  t.is(foodData.supplier, foodSupplier);

  if (typeof foodData.foodId === 'string') {
    t.is(foodData.foodId.length, uuid.length);
  } else {
    t.fail('fooData.foodId expected to be type string');
  }

  const resolvedFoodData = await promise.props(foodData);

  t.is(typeof resolvedFoodData.calories, 'number');
});

test(
  'barrel.createDataObject() passes a partial DataObject to the value() function',
  t => {
    t.plan(6);

    type FoodTable = { foodId: string; calories: number; vitamins: string[]; };

    const barrel = createBarrel();
    const foodId = 'this-is-a-food-id';
    const calories = 120;
    const vitamins = ['A', 'B', 'C'];

    const columnFoodId: PropertyDefinition<FoodTable, 'foodId'> = {
      name: 'food_id',
      prop: 'foodId',
      value: foodId
    };

    const columnCalories: PropertyDefinition<FoodTable, 'calories'> = {
      name: 'calories',
      value(obj, currentKey) {
        t.is(obj.foodId, foodId);
        t.is(currentKey, 'calories');

        return calories;
      }
    };

    const columnVitamins: PropertyDefinition<FoodTable, 'vitamins'> = {
      name: 'vitamins',
      value(obj, currentKey) {
        t.is(obj.foodId, foodId);
        t.is(obj.calories, calories);
        t.is(currentKey, 'vitamins');

        return vitamins;
      }
    };

    const properties: PropertyDefinitions<FoodTable> = [
      columnFoodId,
      columnCalories,
      columnVitamins
    ];

    const schema = {
      schemaName: 'food',
      properties
    };

    barrel.addSchema('food', schema);

    const foodRow = barrel.createDataObject<FoodTable>('food');

    t.deepEqual(foodRow, {foodId, calories, vitamins});
  }
);

test(
  'barrel.generateSingleBatch()  generates a single batch for a single dataObject',
  t => {
    type FoodTable = { foodId: string; };
    type IngredientTable = { ingredientId: string; };

    const barrel = createBarrel();
    const foodId = 'this-is-a-food-id';
    const ingredientId = 'ingredient1';

    const columnFoodId: PropertyDefinition<FoodTable, 'foodId'> = {
      name: 'food_id',
      prop: 'foodId',
      value: foodId
    };

    const propertiesForFood: PropertyDefinitions<FoodTable> = [
      columnFoodId
    ];

    const columnIngredientId: PropertyDefinition<IngredientTable, 'ingredientId'> = {
      name: 'ingredient_id',
      prop: 'ingredientId',
      value: ingredientId
    };

    const propertiesForIngredient: PropertyDefinitions<IngredientTable> = [
      columnIngredientId
    ];

    const foodSchema = {
      schemaName: 'food',
      properties: propertiesForFood
    };

    const ingredientSchema = {
      schemaName: 'ingredient',
      properties: propertiesForIngredient
    };

    barrel.addSchema('food', foodSchema);
    barrel.addSchema('ingredient', ingredientSchema);

    t.is(barrel.dataObjects.length, 0);
    t.is(barrel.batches.length, 0);

    const foodBatch = barrel.generateSingleBatch<FoodTable>('food');
    const [queuedData1] = barrel.dataObjects.slice(foodBatch.begin, foodBatch.end);
    const [queuedBatch1] = barrel.batches;

    t.is(barrel.dataObjects.length, 1);
    t.is(barrel.batches.length, 1);
    t.is(queuedBatch1.begin, 0);
    t.is(queuedBatch1.end, 1);
    t.is(queuedBatch1.batchIndex, 0);
    t.is(typeof queuedBatch1.insertFunction, 'function');

    t.deepEqual(queuedData1, { foodId });
    t.deepEqual(foodBatch, queuedBatch1);

    const ingredientBatch = barrel.generateSingleBatch<IngredientTable>('ingredient');
    const [queuedData2] = barrel.dataObjects.slice(ingredientBatch.begin, ingredientBatch.end);
    const [, queuedBatch2] = barrel.batches;

    t.is(barrel.dataObjects.length, 2);
    t.is(barrel.batches.length, 2);
    t.is(queuedBatch2.begin, 1);
    t.is(queuedBatch2.end, 2);
    t.is(queuedBatch2.batchIndex, 1);
    t.is(typeof queuedBatch2.insertFunction, 'function');

    t.deepEqual(queuedData2, { ingredientId });
    t.deepEqual(ingredientBatch, queuedBatch2);
  }
);

test(
  'barrel.generateManyBatches() generates a single batch for many dataObjects',
  t => {
    type FoodTable = { foodId: string; };
    type IngredientTable = { ingredientId: string; };

    let foodId = 1;
    let ingredientId = 9;

    const barrel = createBarrel();
    const foodIdFunction = () => String(foodId++);
    const ingredientIdFunction = () => String(ingredientId++);

    const columnFoodId: PropertyDefinition<FoodTable, 'foodId'> = {
      name: 'food_id',
      prop: 'foodId',
      value: foodIdFunction
    };

    const propertiesForFood: PropertyDefinitions<FoodTable> = [
      columnFoodId
    ];

    const columnIngredientId: PropertyDefinition<IngredientTable, 'ingredientId'> = {
      name: 'ingredient_id',
      prop: 'ingredientId',
      value: ingredientIdFunction
    };

    const propertiesForIngredient: PropertyDefinitions<IngredientTable> = [
      columnIngredientId
    ];

    const foodSchema = {
      schemaName: 'food',
      properties: propertiesForFood
    };

    const ingredientSchema = {
      schemaName: 'ingredient',
      properties: propertiesForIngredient
    };

    barrel.addSchema('food', foodSchema);
    barrel.addSchema('ingredient', ingredientSchema);

    t.is(barrel.dataObjects.length, 0);
    t.is(barrel.batches.length, 0);

    // ROUND 1
    const foodBatch = barrel.generateManyBatches<FoodTable>('food', 3);
    const foodData = barrel.dataObjects.slice(foodBatch.begin, foodBatch.end);
    const [queuedBatch1] = barrel.batches;

    t.is(barrel.dataObjects.length, 3);
    t.is(barrel.batches.length, 1);
    t.is(queuedBatch1.begin, 0);
    t.is(queuedBatch1.end, 3);
    t.is(queuedBatch1.batchIndex, 0);
    t.is(typeof queuedBatch1.insertFunction, 'function');
    t.deepEqual(foodBatch, queuedBatch1);
    t.deepEqual(foodData, [{ foodId: '3' }, { foodId: '2' }, { foodId: '1' }]);

    // ROUND 2
    const ingredientBatch = barrel.generateManyBatches<IngredientTable>('ingredient', 2);
    const ingredientData = barrel.dataObjects.slice(ingredientBatch.begin, ingredientBatch.end);
    const [, queuedBatch2] = barrel.batches;

    t.is(barrel.dataObjects.length, 5);
    t.is(barrel.batches.length, 2);
    t.is(queuedBatch2.begin, 3);
    t.is(queuedBatch2.end, 5);
    t.is(queuedBatch2.batchIndex, 1);
    t.is(typeof queuedBatch2.insertFunction, 'function');
    t.deepEqual(ingredientBatch, queuedBatch2);
    t.deepEqual(ingredientData, [{ ingredientId: '10' }, { ingredientId: '9' }]);
  }
);

test('barrel.createBatch() queues many data into `dataObjects` and `batches`', t => {
    type FoodTable = { foodId: string; };

    const barrel = createBarrel();
    const insertFunction = () => Promise.resolve();

    // ROUND 1
    const foodData1 = [{ foodId: '1' }, { foodId: '2' }];
    const batch1 = barrel.createBatch<FoodTable>(foodData1, insertFunction);
    const { dataObjects } = barrel;

    t.is(batch1.begin, 0);
    t.is(batch1.end, 2);
    t.is(batch1.batchIndex, 0);
    t.is(batch1.insertFunction, insertFunction);
    t.deepEqual(dataObjects.slice(batch1.begin, batch1.end), foodData1);

    // ROUND 2
    const foodData2 = [{ foodId: '3' }, { foodId: '4' }, { foodId: '5' }];
    const batch2 = barrel.createBatch<FoodTable>(foodData2, insertFunction);

    t.is(batch2.begin, 2);
    t.is(batch2.end, 5);
    t.is(batch2.batchIndex, 1);
    t.is(batch2.insertFunction, insertFunction);
    t.deepEqual(dataObjects.slice(batch2.begin, batch2.end), foodData2);
});

test('barrel.createBatch() queues single data into `dataObjects` and `batches`', t => {
    type FoodTable = { foodId: string; };

    const barrel = createBarrel();
    const insertFunction = () => Promise.resolve();

    // ROUND 1
    const foodData1 = { foodId: '1' };
    const batch1 = barrel.createBatch<FoodTable>(foodData1, insertFunction);
    const { dataObjects } = barrel;

    t.is(batch1.begin, 0);
    t.is(batch1.end, 1);
    t.is(batch1.batchIndex, 0);
    t.is(batch1.insertFunction, insertFunction);
    t.deepEqual(dataObjects.slice(batch1.begin, batch1.end), [foodData1]);

    // ROUND 2
    const foodData2 = { foodId: '2' };
    const batch2 = barrel.createBatch<FoodTable>(foodData2, insertFunction);

    t.is(batch2.begin, 1);
    t.is(batch2.end, 2);
    t.is(batch2.batchIndex, 1);
    t.is(batch2.insertFunction, insertFunction);
    t.deepEqual(dataObjects.slice(batch2.begin, batch2.end), [foodData2]);
});

test(
  'barrel.insert() executes the insertFunction for each batch and passes in correct data',
  async t => {
    interface DinosaurSchema extends SchemaDefinition {
      dinosaurs: string;
    }

    type FoodTable = { foodId: string; };
    type IngredientTable = { ingredientId: string; };
    type NutritionTable = { nutritionId: string; };

    class TestBarrel extends Barrel {
      schemas: SchemaDefinitions<DinosaurSchema> = {};
      createInsertFunction() { return async () => {}; }
    }

    const barrel = new TestBarrel();
    const foodId = 'food-1';
    const ingredientId = 'ingredient-1';
    const nutritionId = 'nuntrition-1';

    // dataObject w/ promise property
    const columnFoodId: PropertyDefinition<FoodTable, 'foodId'> = {
      name: 'food_id',
      prop: 'foodId',
      async value() { return promise.resolve(foodId); }
    };

    // dataObject w/ constant property
    const columnIngredientId: PropertyDefinition<IngredientTable, 'ingredientId'> = {
      name: 'ingredient_id',
      prop: 'ingredientId',
      value: ingredientId
    };

    // dataObject w/ function property (returning constant)
    const columnNutritionId: PropertyDefinition<NutritionTable, 'nutritionId'> = {
      name: 'nutrition_id',
      prop: 'nutritionId',
      value() { return nutritionId; }
    };

    const propertiesForFood: PropertyDefinitions<FoodTable> = [
      columnFoodId
    ];

    const propertiesForIngredient: PropertyDefinitions<IngredientTable> = [
      columnIngredientId
    ];

    const propertiesForNutrition: PropertyDefinitions<NutritionTable> = [
      columnNutritionId
    ];

    const foodSchema = {
      schemaName: 'food',
      properties: propertiesForFood
    };

    const ingredientSchema = {
      schemaName: 'ingredient',
      properties: propertiesForIngredient
    };

    const nutritionSchema = {
      schemaName: 'nutrition',
      properties: [columnNutritionId]
    };

    barrel.addSchema('food', foodSchema);
    barrel.addSchema('ingredient', ingredientSchema);
    barrel.addSchema('nutrition', nutritionSchema);

    t.is(barrel.dataObjects.length, 0);
    t.is(barrel.batches.length, 0);

    const foodBatch = barrel.generateSingleBatch<FoodTable>('food');
    const ingredientBatch = barrel.generateSingleBatch<IngredientTable>('ingredient');
    const nutritionBatch = barrel.generateSingleBatch<NutritionTable>('nutrition');

    foodBatch.insertFunction = async foodData => {
      if (Array.isArray(foodData)) {
        const [data] = foodData;

        t.is(foodData.length, 1);
        t.deepEqual(data, { foodId });
      } else {
        t.fail('data passed to an insert function is expected to be an array');
      }
    };

    ingredientBatch.insertFunction = async ingredientData => {
      if (Array.isArray(ingredientData)) {
        const [data] = ingredientData;

        t.is(ingredientData.length, 1);
        t.deepEqual(data, { ingredientId });
      } else {
        t.fail('data passed to an insert function is expected to be an array');
      }
    };

    nutritionBatch.insertFunction = async nutritionData => {
      if (Array.isArray(nutritionData)) {
        const [data] = nutritionData;

        t.is(nutritionData.length, 1);
        t.deepEqual(data, { nutritionId });
      } else {
        t.fail('data passed to an insert function is expected to be an array');
      }
    };

    await barrel.insert();
  }
);
