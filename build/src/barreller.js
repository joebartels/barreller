"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertModule = require("assert");
const pgp = require("pg-promise");
const assert = assertModule.strict;
const hasOwnProperty = Object.prototype.hasOwnProperty;
class Barrel {
    constructor(connect) {
        this.tables = {};
        this.pgp = pgp();
        this.db = this.pgp(connect);
    }
    addTable(tableName, columnValues) {
        const { pgp: { helpers } } = this;
        const queryColumns = columnValues.map(column => {
            const queryColumn = {
                name: column.name
            };
            if (hasOwnProperty.call(column, 'prop')) {
                queryColumn.prop = column.prop;
            }
            return queryColumn;
        });
        const columnSet = new helpers.ColumnSet(queryColumns, { table: { table: tableName } });
        this.tables[tableName] = { tableName, columnValues, columnSet };
    }
    generateRow(tableName, overrides) {
        const row = Object.create(null);
        const table = this.tables[tableName];
        assert.ok(table, `Table name ${tableName} does not exist. You must addTable() first.`);
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
                obj[key] = Barrel._returnValue(column.value, obj);
            }
            return obj;
        };
        return Object.freeze(columnValues.reduce(reducer, Object.create(null)));
    }
    static _returnValue(value, ...params) {
        if (typeof value === 'function') {
            return value(...params);
        }
        return value;
    }
}
exports.Barrel = Barrel;
//# sourceMappingURL=barreller.js.map