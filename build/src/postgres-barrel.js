"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertModule = require("assert");
const promise = require("bluebird");
const pgp = require("pg-promise");
const barrel_1 = require("./barrel");
const assert = assertModule.strict;
const hasOwnProperty = Object.prototype.hasOwnProperty;
class PostgresBarrel extends barrel_1.Barrel {
    constructor(connection) {
        super();
        this.schemas = {};
        this.pgp = pgp({ promiseLib: promise });
        this.db = this.pgp(connection);
    }
    addTable(tableName, properties) {
        const { pgp: { helpers } } = this;
        const queryColumns = properties.map(column => {
            const queryColumn = { name: column.name };
            if (hasOwnProperty.call(column, 'prop')) {
                queryColumn.prop = column.prop;
            }
            return queryColumn;
        });
        const columnSet = new helpers.ColumnSet(queryColumns, { table: { table: tableName } });
        const schema = {
            tableName,
            properties,
            columnSet,
            schemaName: tableName
        };
        this.addSchema(tableName, schema);
    }
    /**
     * @method createInsertFunction
     * @param schemaName - The schema to create an insert-function for
     * @param callback - Optional - Invoked after data is inserted. Supports promises
     */
    createInsertFunction(tableName, callback) {
        const { schemas, db, pgp: { helpers } } = this;
        const table = schemas[tableName];
        assert.ok(table, `Table name ${tableName} does not exist. You must first addTable(${tableName}, properties)`);
        const { columnSet } = table;
        return async (data) => {
            let resolvedData;
            if (Array.isArray(data)) {
                resolvedData = await promise.all(data.map(a => promise.props(a)));
            }
            else {
                resolvedData = [await promise.props(data)];
            }
            const insert = helpers.insert(resolvedData, columnSet);
            await db.task(`INSERT INTO "${tableName}"`, async (t) => {
                try {
                    if (callback && typeof callback === 'function') {
                        const insertWithReturn = `${insert} returning ${columnSet.names}`;
                        const insertedRow = await t.one(insertWithReturn);
                        await callback(insertedRow);
                    }
                    else {
                        await t.none(insert);
                    }
                }
                catch (err) {
                    throw new Error(err);
                }
            });
        };
    }
    /**
     * Use this as the `value` to any async relationships. This will automatically
     * generate a row of the referenced type.
     *
     * @method references
     * @param tableName The tablename being referenced
     * @param primaryKey The table column where the referenced key exists
     * @returns A function that returns a promise that resolves to the reference's
     *          primary key, when the referenced row is inserted into the database.
     */
    static references(tableName, primaryKey) {
        return async function (obj, columnKey) {
            return new Promise(resolve => {
                const callback = (reference) => resolve(reference[primaryKey]);
                this.generateSingleBatch(tableName, undefined, callback);
            });
        };
    }
}
exports.PostgresBarrel = PostgresBarrel;
// type FoodTable = {
//   foodId: string;
//   calories: number;
//   vitamins: string[];
// };
// type IngredientTable = {
//   foodId: string;
//   ingredientName: string;
// };
// // TESTING PGTable Type - Should be valid:
// const validFoodDataObject: PGTable<FoodTable> = {
//   foodId: 'abc',
//   calories() { return 1; },
//   vitamins() { return new Promise(resolve => resolve(['A', 'B'])); },
// };
// // TESTING PGTable Type - Should be invalid:
// const invalidFoodDataObject: PGTable<FoodTable> = {
//   foodId: 123,
//   calories() { return 'A'; },
//   vitamins() { return new Promise(resolve => resolve([1, 2, 3])); }
// };
// const a = new PostgresBarrel({});
// // TESTING PropertyDefinition - should be valid
// const validFoodIdColumn: PropertyDefinition<FoodTable, 'foodId'> = {
//   name: 'food_id',
//   prop: 'foodId',
//   value() { return 'abc'; }
// };
// // TESTING PropertyDefinition - should be valid
// const validFoodIdColumn2: PropertyDefinition<FoodTable, 'foodId'> = {
//   name: 'food_id',
//   prop: 'foodId',
//   value() { return new Promise(resolve => resolve('abc')); }
// };
// //
// // TESTING PropertyDefinition - should be invalid
// const foodIdColumn: PropertyDefinition<FoodTable, 'foodId'> = {
//   name: 'food_id',
//   prop: 'foodId',
//   value() { return 1; }
// };
// // TESTING PropertyDefinition - should be invalid
// const invalidFoodIdColumn2: PropertyDefinition<FoodTable, 'foodId'> = {
//   name: 'food_id',
//   prop: 'foodId',
//   value() { return new Promise(resolve => resolve(1)); }
// };
// // TESTING PropertyDefinitions - should be partially valid:
// const columns: PropertyDefinitions<FoodTable> = [
//   // valid:
//   foodIdColumn,
//   // invalid b/c hi is not on the FoodTable schema:
//   { name: 'hi', value() { return () => {}; } }
// ];
// a.addTable<FoodTable>('food', columns);
// // Testing references type
// const validFoodIngredientDataObject: PGTable<IngredientTable> = {
//   foodId: PostgresBarrel.references<FoodTable>('food', 'food_id'),
//   calories() { return 1; },
//   vitamins() { return new Promise(resolve => resolve(['A', 'B'])); },
// };
//# sourceMappingURL=postgres-barrel.js.map