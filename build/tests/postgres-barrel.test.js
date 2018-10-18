"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
function createBarrel() {
    // return new PostgresBarrel();
}
ava_1.default.skip('barrel.addTable()', t => {
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
//# sourceMappingURL=postgres-barrel.test.js.map