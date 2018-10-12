"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// export { Barrel } from './barrel';
const assertModule = require("assert");
const pgp = require("pg-promise");
const promise = require("bluebird");
const assert = assertModule.strict;
const hasOwnProperty = Object.prototype.hasOwnProperty;
class Barrel {
    constructor(connect) {
        this.tables = {};
        this.batches = [];
        this.rows = [];
        this.pgp = pgp({ promiseLib: promise });
        this.db = this.pgp(connect);
    }
    addTable(tableName, columnValues) {
        const { pgp: { helpers } } = this;
        const queryColumns = columnValues.map(column => {
            const queryColumn = { name: column.name };
            if (hasOwnProperty.call(column, 'prop')) {
                queryColumn.prop = column.prop;
            }
            return queryColumn;
        });
        const columnSet = new helpers.ColumnSet(queryColumns, { table: { table: tableName } });
        this.tables[tableName] = { tableName, columnValues, columnSet };
    }
    generateRow(tableName, overrides, callback) {
        const { rows, batches } = this;
        const data = this.createRowObject(tableName, overrides);
        const insertFunction = this.createInsertFunction(tableName, callback);
        const rowIndex = rows.push(data) - 1;
        const batchData = { begin: rowIndex, end: rowIndex + 1, insertFunction };
        const batchIndex = batches.push(batchData) - 1;
        batchData.batchIndex = batchIndex;
        return data;
    }
    /**
     * Given a `tableName`, a row-object is created using the `columnValues`
     * provided to `addTable(tableName, columnValues)`.
     *
     * @method createRowObject
     * @param tableName {string}
     * @param overrides {object}
     */
    createRowObject(tableName, overrides) {
        const hash = {};
        const table = this.tables[tableName];
        assert.ok(table, `Table name ${tableName} does not exist. You must first addTable(${tableName}, columnValues)`);
        const { columnValues } = table;
        const reducer = (obj, column) => {
            let key;
            if (column.prop && hasOwnProperty.call(column, 'prop')) {
                key = column.prop;
            }
            else {
                key = column.name;
            }
            if (overrides && hasOwnProperty.call(overrides, key)) {
                obj[key] = overrides[key];
            }
            else {
                obj[key] = Barrel._returnValue.call(this, column.value, obj, key);
            }
            return obj;
        };
        return columnValues.reduce(reducer, hash);
    }
    async insert() {
        const { rows, batches, db, pgp: { helpers } } = this;
        let promise = Promise.resolve();
        let numberOfInserts = 0;
        const incrementInserts = () => { numberOfInserts++; };
        while (batches.length > 0) {
            const batch = batches.shift();
            if (batch) {
                const data = rows.slice(batch.begin, batch.end);
                const onError = (err) => {
                    console.error(`Error inserting rows[${batch.begin}:${batch.end})`);
                    throw err;
                };
                promise = promise
                    .then(async () => await batch.insertFunction(data))
                    .then(incrementInserts)
                    .catch(onError);
            }
        }
        try {
            await promise;
        }
        catch (err) {
            console.error('insert() failed');
            throw err;
        }
    }
    /**
     * @method createInsertFunction
     * @param tableName
     * @param data
     * @param callback Optional. When provided, the inserted row is passed into
     * the callback as the first parameter.
     * @returns An async function that inserts the row into the database.
     * @private
     */
    createInsertFunction(tableName, callback) {
        const { tables, db, pgp: { helpers } } = this;
        const table = tables[tableName];
        assert.ok(table, `Table name ${tableName} does not exist. You must first addTable(${tableName}, columnValues)`);
        const { columnSet } = table;
        return async (data) => {
            let resolvedData;
            // can potentially always treat data like an array
            // e.g. if data is reassigned like `data = [].concat(data)`
            if (Array.isArray(data)) {
                resolvedData = await promise.all(data.map(a => promise.props(a)));
            }
            else {
                resolvedData = await promise.props(data);
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
    static _returnValue(value, ...params) {
        if (typeof value === 'function') {
            return value.call(this, ...params);
        }
        return value;
    }
    /**
     * Use this as the `value` to any async relationships. This will automatically
     * generate a row of the referenced type.
     *
     * @method reference
     * @param tableName The tablename being referenced
     * @param primaryKey The table column where the referenced key exists
     * @returns A function that returns a promise that resolves to the reference's
     *          primary key, when the referenced row is inserted into the database.
     */
    static references(tableName, primaryKey) {
        return async function (obj, columnKey) {
            // const { insertFunction } = this.generateRow(tableName, undefined);
            // return insertFunction.then()
            return new Promise(resolve => {
                const callback = (reference) => resolve(reference[primaryKey]);
                this.generateRow(tableName, undefined, callback);
            });
        };
    }
}
exports.Barrel = Barrel;
//# sourceMappingURL=barreller.js.map