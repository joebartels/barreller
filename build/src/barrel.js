"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertModule = require("assert");
const promise = require("bluebird");
// import { BatchInsertFunction, BatchObject, ColumnDefinition, ColumnDefinitions, InsertFunctionCallback, TableDefinition, TableDefinitions } from './types';
const assert = assertModule.strict;
const hasOwnProperty = Object.prototype.hasOwnProperty;
class Barrel {
    constructor() {
        // extending class should be more specific with value's Type
        this.schemas = {};
        // each batch holds information for what data to add to database and a function for adding the data.
        this.batches = [];
        // rows store the raw data (in memory for now)
        this.dataObjects = [];
    }
    addSchema(schemaName, schemaDefinition) {
        this.schemas[schemaName] = schemaDefinition;
    }
    generateSingleBatch(schemaName, overrides, callback) {
        const { dataObjects, batches } = this;
        const data = this.createDataObject(schemaName, overrides);
        const insertFunction = this.createInsertFunction(schemaName, callback);
        return this.createBatch(data, insertFunction);
    }
    generateManyBatches(schemaName, howMany, overrides, callback) {
        const data = new Array(howMany);
        const { dataObjects, batches } = this;
        while (howMany-- > 0) {
            data[howMany] = this.createDataObject(schemaName, overrides);
        }
        const insertFunction = this.createInsertFunction(schemaName, callback);
        return this.createBatch(data, insertFunction);
    }
    createBatch(data, insertFunction) {
        const { dataObjects, batches } = this;
        let dataIndexBegin;
        let dataIndexEnd;
        if (Array.isArray(data)) {
            dataIndexEnd = dataObjects.push.apply(dataObjects, data);
            dataIndexBegin = dataIndexEnd - data.length;
        }
        else {
            dataIndexEnd = dataObjects.push(data);
            dataIndexBegin = dataIndexEnd - 1;
        }
        const batchData = {
            begin: dataIndexBegin,
            end: dataIndexEnd,
            insertFunction
        };
        batchData.batchIndex = batches.push(batchData) - 1;
        return batchData;
    }
    createDataObject(schemaName, overrides) {
        const hash = {};
        const schema = this.schemas[schemaName];
        assert.ok(schema, `Schema name "${schemaName}" does not exist. You must first addSchema(${schemaName}, schemaDefinition)`);
        const { properties } = schema;
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
        return properties.reduce(reducer, hash);
    }
    /**
     * Iterates through each batch, grabs the correct slice of data (from `dataObjects`)
     * and passes the data into the batch's `insertFunction`.
     *
     * @method insert
     * @async
     */
    async insert() {
        const { dataObjects, batches } = this;
        let promiseChain = promise.resolve();
        let numberOfInserts = 0;
        const incrementInserts = () => { numberOfInserts++; };
        while (batches.length > 0) {
            const batch = batches.shift();
            if (batch) {
                const data = dataObjects.slice(batch.begin, batch.end);
                const onError = (err) => {
                    console.error(`Error inserting rows[${batch.begin}:${batch.end})`);
                    throw err;
                };
                const resolvedData = await promise.all(data.map(a => promise.props(a)));
                promiseChain = promiseChain
                    .then(async () => await batch.insertFunction(resolvedData))
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
        finally {
            console.log(`${numberOfInserts} records inserted.`);
        }
    }
    /**
     * Either invokes a function, passing in arbitrary params, or simply returns the value it was passed.
     * **not promise aware**
     *
     * @param this Barrel instance
     * @param value Either a function or constant value.
     * @param params Arbitrary number of params to pass to the value-function.
     */
    static _returnValue(value, ...params) {
        if (typeof value === 'function') {
            return value.apply(this, params);
        }
        return value;
    }
}
exports.Barrel = Barrel;
//# sourceMappingURL=barrel.js.map