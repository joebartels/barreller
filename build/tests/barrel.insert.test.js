"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const faker_1 = require("faker");
const barreller_1 = require("../src/barreller");
const pg_1 = require("./db/pg");
ava_1.default.only('`barrel.insert()` inserts data into database', async (t) => {
    const barrel = new barreller_1.Barrel(pg_1.connectionOptions());
    await pg_1.init(barrel.db);
    const calories = 100;
    const foodId1 = faker_1.random.uuid();
    const foodId2 = faker_1.random.uuid();
    const foodIds = [
        foodId1,
        foodId2
    ];
    const columnFoodId = {
        name: 'food_id',
        prop: 'foodId',
        value() { return foodIds.shift() || ''; }
    };
    const columnCalories = {
        name: 'calories',
        value: calories
    };
    const columns = [
        columnFoodId,
        columnCalories
    ];
    barrel.addTable('food', columns);
    barrel.generateRow('food');
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
    barrel.generateRow('food');
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
    await pg_1.teardown(barrel.db);
});
ava_1.default.only('`barrel.insert()` inserts references into database', async (t) => {
    const barrel = new barreller_1.Barrel(pg_1.connectionOptions());
    await pg_1.init(barrel.db);
    const foodId = faker_1.random.uuid();
    const ingredientId = faker_1.random.uuid();
    const foodColumnFoodId = {
        name: 'food_id',
        prop: 'foodId',
        value: foodId
    };
    const ingredientColumnIngredientId = {
        name: 'ingredient_id',
        prop: 'ingredientId',
        value: ingredientId
    };
    const foodIngredientColumnFoodId = {
        name: 'food_id',
        prop: 'foodId',
        value: barreller_1.Barrel.references('food', 'food_id')
    };
    const foodIngredientColumnIngredientId = {
        name: 'ingredient_id',
        prop: 'ingredientId',
        value: barreller_1.Barrel.references('ingredient', 'ingredient_id')
    };
    const foodColumns = [
        foodColumnFoodId
    ];
    const ingredientColumns = [
        ingredientColumnIngredientId
    ];
    const foodIngredientColumns = [
        foodIngredientColumnFoodId,
        foodIngredientColumnIngredientId
    ];
    barrel.addTable('food', foodColumns);
    barrel.addTable('ingredient', ingredientColumns);
    barrel.addTable('food_ingredient', foodIngredientColumns);
    barrel.generateRow('food_ingredient');
    const [existingFoods, existingIngredients, existingFoodIngredients] = await Promise.all([
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
    await pg_1.teardown(barrel.db);
});
//# sourceMappingURL=barrel.insert.test.js.map