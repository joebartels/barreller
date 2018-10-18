"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const promise = require("bluebird");
const faker_1 = require("faker");
const barrel_1 = require("../src/barrel");
function createBarrel() {
    class TestBarrel extends barrel_1.Barrel {
        constructor() {
            super(...arguments);
            this.schemas = {};
        }
        createInsertFunction() { return async () => { }; }
    }
    return new TestBarrel();
}
ava_1.default('Barrel._returnValue on static value', t => {
    const value = 'hi';
    const barrel = createBarrel();
    t.is(barrel_1.Barrel._returnValue.call(barrel, value), value);
});
ava_1.default('Barrel._returnValue on function without params', t => {
    const value = 'hi';
    const valueFunction = () => value;
    const barrel = createBarrel();
    t.is(barrel_1.Barrel._returnValue.call(barrel, valueFunction), value);
});
ava_1.default('Barrel._returnValue on function with params', t => {
    const valueFunction = (...params) => `params are ${params.join(',')}`;
    const barrel = createBarrel();
    t.is(barrel_1.Barrel._returnValue.call(barrel, valueFunction, 'a', 'b', 'c'), 'params are a,b,c');
});
ava_1.default('barrel.addSchema()', t => {
    const barrel = createBarrel();
    const schema = {
        schemaName: 'food',
        properties: [],
        dinosaurs: 't-rex'
    };
    barrel.addSchema('food', schema);
    t.deepEqual(barrel.schemas['food'], schema);
});
ava_1.default('barrel.createDataObject() creates a DataObject', async (t) => {
    const barrel = createBarrel();
    const uuid = 'b9bf40aa-5908-4210-a97e-162ca9bb470f';
    // function value
    const columnFoodId = {
        name: 'food_id',
        prop: 'foodId',
        value() {
            return faker_1.random.uuid();
        }
    };
    // promise value
    const columnCalories = {
        name: 'calories',
        value() {
            return Promise.resolve(faker_1.random.number());
        }
    };
    // static value
    const foodSupplier = 'acme inc.';
    const columnSupplier = {
        name: 'supplier',
        value: foodSupplier
    };
    const properties = [
        columnFoodId,
        columnCalories,
        columnSupplier
    ];
    const foodSchema = {
        schemaName: 'food',
        properties
    };
    barrel.addSchema('food', foodSchema);
    const foodData = barrel.createDataObject('food');
    t.is(foodData.supplier, foodSupplier);
    if (typeof foodData.foodId === 'string') {
        t.is(foodData.foodId.length, uuid.length);
    }
    else {
        t.fail('fooData.foodId expected to be type string');
    }
    const resolvedFoodData = await promise.props(foodData);
    t.is(typeof resolvedFoodData.calories, 'number');
});
ava_1.default('barrel.createDataObject() passes a partial DataObject to the value() function', t => {
    t.plan(6);
    const barrel = createBarrel();
    const foodId = 'this-is-a-food-id';
    const calories = 120;
    const vitamins = ['A', 'B', 'C'];
    const columnFoodId = {
        name: 'food_id',
        prop: 'foodId',
        value: foodId
    };
    const columnCalories = {
        name: 'calories',
        value(obj, currentKey) {
            t.is(obj.foodId, foodId);
            t.is(currentKey, 'calories');
            return calories;
        }
    };
    const columnVitamins = {
        name: 'vitamins',
        value(obj, currentKey) {
            t.is(obj.foodId, foodId);
            t.is(obj.calories, calories);
            t.is(currentKey, 'vitamins');
            return vitamins;
        }
    };
    const properties = [
        columnFoodId,
        columnCalories,
        columnVitamins
    ];
    const schema = {
        schemaName: 'food',
        properties
    };
    barrel.addSchema('food', schema);
    const foodRow = barrel.createDataObject('food');
    t.deepEqual(foodRow, { foodId, calories, vitamins });
});
ava_1.default('barrel.generateSingleBatch()  generates a single batch for a single dataObject', t => {
    const barrel = createBarrel();
    const foodId = 'this-is-a-food-id';
    const ingredientId = 'ingredient1';
    const columnFoodId = {
        name: 'food_id',
        prop: 'foodId',
        value: foodId
    };
    const propertiesForFood = [
        columnFoodId
    ];
    const columnIngredientId = {
        name: 'ingredient_id',
        prop: 'ingredientId',
        value: ingredientId
    };
    const propertiesForIngredient = [
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
    const foodBatch = barrel.generateSingleBatch('food');
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
    const ingredientBatch = barrel.generateSingleBatch('ingredient');
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
});
ava_1.default('barrel.generateManyBatches() generates a single batch for many dataObjects', t => {
    let foodId = 1;
    let ingredientId = 9;
    const barrel = createBarrel();
    const foodIdFunction = () => String(foodId++);
    const ingredientIdFunction = () => String(ingredientId++);
    const columnFoodId = {
        name: 'food_id',
        prop: 'foodId',
        value: foodIdFunction
    };
    const propertiesForFood = [
        columnFoodId
    ];
    const columnIngredientId = {
        name: 'ingredient_id',
        prop: 'ingredientId',
        value: ingredientIdFunction
    };
    const propertiesForIngredient = [
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
    const foodBatch = barrel.generateManyBatches('food', 3);
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
    const ingredientBatch = barrel.generateManyBatches('ingredient', 2);
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
});
ava_1.default('barrel.createBatch() queues many data into `dataObjects` and `batches`', t => {
    const barrel = createBarrel();
    const insertFunction = () => Promise.resolve();
    // ROUND 1
    const foodData1 = [{ foodId: '1' }, { foodId: '2' }];
    const batch1 = barrel.createBatch(foodData1, insertFunction);
    const { dataObjects } = barrel;
    t.is(batch1.begin, 0);
    t.is(batch1.end, 2);
    t.is(batch1.batchIndex, 0);
    t.is(batch1.insertFunction, insertFunction);
    t.deepEqual(dataObjects.slice(batch1.begin, batch1.end), foodData1);
    // ROUND 2
    const foodData2 = [{ foodId: '3' }, { foodId: '4' }, { foodId: '5' }];
    const batch2 = barrel.createBatch(foodData2, insertFunction);
    t.is(batch2.begin, 2);
    t.is(batch2.end, 5);
    t.is(batch2.batchIndex, 1);
    t.is(batch2.insertFunction, insertFunction);
    t.deepEqual(dataObjects.slice(batch2.begin, batch2.end), foodData2);
});
ava_1.default('barrel.createBatch() queues single data into `dataObjects` and `batches`', t => {
    const barrel = createBarrel();
    const insertFunction = () => Promise.resolve();
    // ROUND 1
    const foodData1 = { foodId: '1' };
    const batch1 = barrel.createBatch(foodData1, insertFunction);
    const { dataObjects } = barrel;
    t.is(batch1.begin, 0);
    t.is(batch1.end, 1);
    t.is(batch1.batchIndex, 0);
    t.is(batch1.insertFunction, insertFunction);
    t.deepEqual(dataObjects.slice(batch1.begin, batch1.end), [foodData1]);
    // ROUND 2
    const foodData2 = { foodId: '2' };
    const batch2 = barrel.createBatch(foodData2, insertFunction);
    t.is(batch2.begin, 1);
    t.is(batch2.end, 2);
    t.is(batch2.batchIndex, 1);
    t.is(batch2.insertFunction, insertFunction);
    t.deepEqual(dataObjects.slice(batch2.begin, batch2.end), [foodData2]);
});
ava_1.default('barrel.insert() executes the insertFunction for each batch and passes in correct data', async (t) => {
    class TestBarrel extends barrel_1.Barrel {
        constructor() {
            super(...arguments);
            this.schemas = {};
        }
        createInsertFunction() { return async () => { }; }
    }
    const barrel = new TestBarrel();
    const foodId = 'food-1';
    const ingredientId = 'ingredient-1';
    const nutritionId = 'nuntrition-1';
    // dataObject w/ promise property
    const columnFoodId = {
        name: 'food_id',
        prop: 'foodId',
        async value() { return promise.resolve(foodId); }
    };
    // dataObject w/ constant property
    const columnIngredientId = {
        name: 'ingredient_id',
        prop: 'ingredientId',
        value: ingredientId
    };
    // dataObject w/ function property (returning constant)
    const columnNutritionId = {
        name: 'nutrition_id',
        prop: 'nutritionId',
        value() { return nutritionId; }
    };
    const propertiesForFood = [
        columnFoodId
    ];
    const propertiesForIngredient = [
        columnIngredientId
    ];
    const propertiesForNutrition = [
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
    const foodBatch = barrel.generateSingleBatch('food');
    const ingredientBatch = barrel.generateSingleBatch('ingredient');
    const nutritionBatch = barrel.generateSingleBatch('nutrition');
    foodBatch.insertFunction = async (foodData) => {
        if (Array.isArray(foodData)) {
            const [data] = foodData;
            t.is(foodData.length, 1);
            t.deepEqual(data, { foodId });
        }
        else {
            t.fail('data passed to an insert function is expected to be an array');
        }
    };
    ingredientBatch.insertFunction = async (ingredientData) => {
        if (Array.isArray(ingredientData)) {
            const [data] = ingredientData;
            t.is(ingredientData.length, 1);
            t.deepEqual(data, { ingredientId });
        }
        else {
            t.fail('data passed to an insert function is expected to be an array');
        }
    };
    nutritionBatch.insertFunction = async (nutritionData) => {
        if (Array.isArray(nutritionData)) {
            const [data] = nutritionData;
            t.is(nutritionData.length, 1);
            t.deepEqual(data, { nutritionId });
        }
        else {
            t.fail('data passed to an insert function is expected to be an array');
        }
    };
    await barrel.insert();
});
// test('barrel.addTable()', t => {
//   const barrel = new Barrel({});
//   type FoodTable = { food_id: string; name: string; supplier: string; };
//   const columnFoodId: ColumnDefinition<FoodTable, 'food_id'> = {
//     name: 'food_id',
//     value() {
//       return random.uuid();
//     }
//   };
//   const columnName: ColumnDefinition<FoodTable, 'name'> = {
//     name: 'name',
//     value() {
//       return lorem.word();
//     }
//   };
//   const columnSupplier: ColumnDefinition<FoodTable, 'supplier'> = {
//     name: 'supplier',
//     value: 'acme inc.'
//   };
//   const columnValues: Array<ColumnDefinition<FoodTable, any>> =
//       [columnFoodId, columnName, columnSupplier];
//   const columnSet: TQueryColumns =
//       [{name: 'food_id', prop: 'foodId'}, {name: 'name'}, {name: 'supplier'}];
//   barrel.addTable<FoodTable>('food', columnValues);
//   const table = barrel.tables['food'];
//   t.is(table.tableName, 'food');
//   return barrel.pgp.end();
// });
//# sourceMappingURL=barrel.test.js.map