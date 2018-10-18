import * as assertModule from 'assert';
import * as promise from 'bluebird';

// import { BatchInsertFunction, BatchObject, ColumnDefinition, ColumnDefinitions, InsertFunctionCallback, TableDefinition, TableDefinitions } from './types';

const assert = assertModule.strict;
const hasOwnProperty = Object.prototype.hasOwnProperty;

export interface SchemaDefinition {
  // The name of the schema. Typically this is a one-to-one with the database table/document/etc.
  schemaName: string;
  // An array of PropertyDefinitions
  properties: Array<PropertyDefinition<any, any>>;
}

/**
 * @argument SchemaDefinition - The schema-definition is driver specific
 */
export interface SchemaDefinitions<CustomSchemaDefinition extends SchemaDefinition> {
  [index: string]: CustomSchemaDefinition;
}

/**
 * A property definition describes how a value is generated for a given column/property.
 *
 * @argument Schema - The schema that this property belongs to.
 * @argument K - The key name on the schema that represents this property. E.g. `PropertyDefinition<FoodTable, 'foodName'>`
 */
export interface PropertyDefinition<Schema, K extends keyof Schema> {
  // The name used to identify this property in the database. case sensitive.
  name: string;
  // Either a function or a static value. The function must return the correct type, or a promise resolving to the correct type. The type is defined by the provided `Schema` argument.
  value: PropertyValueFunction<Schema, Schema[K]> | Schema[K];

  // The key used locally when creating a data object for this schema.
  prop?: string;
}

/**
 * Not sure how to implement this type. Each PropertyDefinition should be validated
 * against the passed in Schema argument... but having difficulty declaring that correctly.
 *
 * @argument Schema - The schema must be shared each PropertyDefinition in this array.
 */
export interface PropertyDefinitions<Schema> extends Array<PropertyDefinition<Schema, any>> {}

/**
 * @argument Schema - The schema where this value-function is being used.
 * @argument ReturnT - The return type for the function
 * @param partialObj - A value-function recieves a partially hydrated object when it's invoked.
 * @param propertyName - The partialObj's key is also included incase the value function needs to know the property for which it's being invoked.
 */
export interface PropertyValueFunction<Schema, ReturnT> {
  (partialObj: Partial<Schema>, propertyName: string): ReturnT | Promise<ReturnT>;
}

export interface InsertFunctionCallback<T> {
  <K extends T>(row: K): void;
  // or more strictly...
  // (row: T): void;
}

export interface BatchInsertFunction<T> {
  (data: T | T[]): Promise<void>;
}

export interface BatchObject<T> {
  begin: number;
  end: number;
  batchIndex?: number;
  insertFunction: BatchInsertFunction<T>;
}

export type PromiseyDataObject<T> = object & {[P in keyof T]: T[P] | PromiseLike<T[P]>; };

export abstract class Barrel {
  // extending class should be more specific with value's Type
  abstract schemas: SchemaDefinitions<any> = {};

  // each batch holds information for what data to add to database and a function for adding the data.
  batches: Array<BatchObject<any>> = [];

  // rows store the raw data (in memory for now)
  dataObjects: Array<{}> = [];

  constructor() { }

  addSchema<T>(schemaName: string, schemaDefinition: SchemaDefinition) {
    this.schemas[schemaName] = schemaDefinition;
  }

  generateSingleBatch<T>(
      this: Barrel,
      schemaName: string,
      overrides?: Partial<T>,
      callback?: InsertFunctionCallback<T>
  ): BatchObject<T> {
    const {dataObjects, batches} = this;

    const data = this.createDataObject<T>(schemaName, overrides);
    const insertFunction = this.createInsertFunction<T>(schemaName, callback);

    return this.createBatch(data, insertFunction);
  }

  generateManyBatches<T>(
    this: Barrel,
    schemaName: string,
    howMany: number,
    overrides?: Partial<T>,
    callback?: InsertFunctionCallback<T>
  ): BatchObject<T> {
    const data = new Array(howMany);
    const {dataObjects, batches} = this;

    while (howMany-- > 0) {
      data[howMany] = this.createDataObject(schemaName, overrides);
    }

    const insertFunction = this.createInsertFunction<T>(schemaName, callback);

    return this.createBatch(data, insertFunction);
  }

  createBatch<T>(
    this: Barrel,
    data: PromiseyDataObject<T> | Array<PromiseyDataObject<T>>,
    insertFunction: BatchInsertFunction<T>
  ): BatchObject<T> {
    const {dataObjects, batches} = this;
    let dataIndexBegin;
    let dataIndexEnd;

    if (Array.isArray(data)) {
      dataIndexEnd = dataObjects.push.apply(dataObjects, data);
      dataIndexBegin = dataIndexEnd - data.length;
    } else {
      dataIndexEnd = dataObjects.push(data);
      dataIndexBegin = dataIndexEnd - 1;
    }

    const batchData: BatchObject<T> = {
      begin: dataIndexBegin,
      end: dataIndexEnd,
      insertFunction
    };

    batchData.batchIndex = batches.push(batchData) - 1;

    return batchData;
  }

  createDataObject<T>(
    this: Barrel,
    schemaName: string,
    overrides?: {[index: string]: any}
  ): PromiseyDataObject<T> {
    const hash: {[key: string]: any} = {};
    const schema: SchemaDefinition = this.schemas[schemaName];

    assert.ok(
        schema,
        `Schema name "${schemaName}" does not exist. You must first addSchema(${
            schemaName}, schemaDefinition)`);

    const {properties} = schema;

    const reducer = (obj: typeof hash, column: PropertyDefinition<T, any>) => {
      let key;

      if (column.prop && hasOwnProperty.call(column, 'prop')) {
        key = column.prop;
      } else {
        key = column.name;
      }

      if (overrides && hasOwnProperty.call(overrides, key)) {
        obj[key] = overrides[key];
      } else {
        obj[key] = Barrel._returnValue.call(this, column.value, obj, key);
      }

      return obj;
    };

    return properties.reduce(reducer, hash) as PromiseyDataObject<T>;
  }

  abstract createInsertFunction<T>(
    schemaName: string,
    callback?: InsertFunctionCallback<T>
  ): BatchInsertFunction<T>;

  /**
   * Iterates through each batch, grabs the correct slice of data (from `dataObjects`)
   * and passes the data into the batch's `insertFunction`.
   *
   * @method insert
   * @async
   */
  async insert(this: Barrel) {
    const { dataObjects, batches } = this;
    let promiseChain = promise.resolve();
    let numberOfInserts = 0;

    const incrementInserts = () => { numberOfInserts++; };

    while (batches.length > 0) {
      const batch = batches.shift();

      if (batch) {
        const data = dataObjects.slice(batch.begin, batch.end);
        const onError = (err: Error) => {
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
    } catch (err) {
      console.error('insert() failed');
      throw err;
    } finally {
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
  static _returnValue<ReturnType>(
      this: Barrel,
      value: ReturnType,
      ...params: any[]
  ) {
    if (typeof value === 'function') {
      return value.apply(this, params);
    }

    return value;
  }
}
