"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const faker_1 = require("faker");
const barreller_1 = require("../src/barreller");
ava_1.default('barrel.addTable()', t => {
    const barrel = new barreller_1.Barrel({});
    const columnFoodId = {
        name: 'food_id',
        value() {
            return faker_1.random.uuid();
        }
    };
    const columnName = {
        name: 'name',
        value() {
            return faker_1.lorem.word();
        }
    };
    const columnSupplier = {
        name: 'supplier',
        value: 'acme inc.'
    };
    const columnValues = [columnFoodId, columnName, columnSupplier];
    const columnSet = [{ name: 'food_id', prop: 'foodId' }, { name: 'name' }, { name: 'supplier' }];
    barrel.addTable('food', columnValues);
    const table = barrel.tables['food'];
    t.is(table.tableName, 'food');
    return barrel.pgp.end();
});
ava_1.default('barrel.generateRow() creates a RowObject', t => {
    const barrel = new barreller_1.Barrel({});
    const uuid = 'b9bf40aa-5908-4210-a97e-162ca9bb470f';
    const columnFoodId = {
        name: 'food_id',
        prop: 'foodId',
        value() {
            return faker_1.random.uuid();
        }
    };
    const columnCalories = {
        name: 'calories',
        value() {
            return faker_1.random.number();
        }
    };
    const columnSupplier = {
        name: 'supplier',
        value: 'acme inc.'
    };
    const columnValues = [columnFoodId, columnCalories, columnSupplier];
    barrel.addTable('food', columnValues);
    const foodRow = barrel.generateRow('food');
    t.is(foodRow.foodId.length, uuid.length);
    t.is(typeof foodRow.calories, 'number');
    t.is(foodRow.supplier, 'acme inc.');
    return barrel.pgp.end();
});
ava_1.default('barrel.generateRow() passes a partial RowObject to the value() function', t => {
    t.plan(6);
    const barrel = new barreller_1.Barrel({});
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
    const columnValues = [
        columnFoodId,
        columnCalories,
        columnVitamins
    ];
    barrel.addTable('food', columnValues);
    const foodRow = barrel.generateRow('food');
    t.deepEqual(foodRow, { foodId, calories, vitamins });
    return barrel.pgp.end();
});
ava_1.default('barrel.generateRow() queues a rows data into `rows` and `batches`', t => {
    const barrel = new barreller_1.Barrel({});
    const foodId = 'this-is-a-food-id';
    const ingredientId = 'ingredient1';
    const columnFoodId = {
        name: 'food_id',
        prop: 'foodId',
        value: foodId
    };
    const columnValuesForFood = [
        columnFoodId
    ];
    const columnIngredientId = {
        name: 'ingredient_id',
        prop: 'ingredientId',
        value: ingredientId
    };
    const columnValuesForIngredient = [
        columnIngredientId
    ];
    barrel.addTable('food', columnValuesForFood);
    barrel.addTable('ingredient', columnValuesForIngredient);
    t.is(barrel.rows.length, 0);
    t.is(barrel.batches.length, 0);
    const foodRow = barrel.generateRow('food');
    t.is(barrel.rows.length, 1);
    t.is(barrel.batches.length, 1);
    t.deepEqual(foodRow, { foodId });
    const [queuedData1] = barrel.rows;
    const [queuedBatch1] = barrel.batches;
    t.deepEqual(queuedData1, { foodId });
    t.is(queuedBatch1.begin, 0);
    t.is(queuedBatch1.end, 1);
    t.is(queuedBatch1.batchIndex, 0);
    t.is(typeof queuedBatch1.insertFunction, 'function');
    const ingredientRow = barrel.generateRow('ingredient');
    const [, queuedData2] = barrel.rows;
    const [, queuedBatch2] = barrel.batches;
    t.deepEqual(queuedData2, { ingredientId });
    t.is(queuedBatch2.batchIndex, 1);
    t.is(queuedBatch2.begin, 1);
    t.is(queuedBatch2.end, 2);
    t.is(typeof queuedBatch2.insertFunction, 'function');
    return barrel.pgp.end();
});
// test('barrel.generateRow() with references', async t => {
//   const barrel = new Barrel({});
//   barrel.
// });
//# sourceMappingURL=barrel.test.js.map