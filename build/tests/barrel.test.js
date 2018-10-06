"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const faker_1 = require("faker");
const barreller_1 = require("../src/barreller");
ava_1.default('barrel.addTable()', t => {
    const barrel = new barreller_1.Barrel({});
    const columnValues = [
        {
            name: 'food_id',
            value() {
                return faker_1.random.uuid();
            }
        },
        {
            name: 'name',
            value() {
                return faker_1.lorem.word();
            }
        },
        { name: 'supplier', value: 'acme inc.' }
    ];
    const columnSet = [{ name: 'food_id', prop: 'foodId' }, { name: 'name' }, { name: 'supplier' }];
    barrel.addTable('food', columnValues);
    const table = barrel.tables['food'];
    t.is(table.tableName, 'food');
    return barrel.pgp.end();
});
ava_1.default('barrel.generateRow() creates a RowObject', t => {
    const barrel = new barreller_1.Barrel({});
    const uuid = 'b9bf40aa-5908-4210-a97e-162ca9bb470f';
    const columnValues = [
        {
            name: 'food_id',
            prop: 'foodId',
            value() {
                return faker_1.random.uuid();
            }
        },
        {
            name: 'calories',
            value() {
                return faker_1.random.number();
            }
        },
        {
            name: 'supplier',
            value: 'acme inc.'
        }
    ];
    barrel.addTable('food', columnValues);
    const foodRow = barrel.generateRow('food');
    console.log(foodRow);
    t.is(foodRow.foodId.length, uuid.length);
    t.is(typeof foodRow.calories, 'number');
    t.is(foodRow.supplier, 'acme inc.');
    return barrel.pgp.end();
});
//# sourceMappingURL=barrel.test.js.map