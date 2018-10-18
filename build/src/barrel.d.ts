export interface SchemaDefinition {
    schemaName: string;
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
    name: string;
    value: PropertyValueFunction<Schema, Schema[K]> | Schema[K];
    prop?: string;
}
/**
 * Not sure how to implement this type. Each PropertyDefinition should be validated
 * against the passed in Schema argument... but having difficulty declaring that correctly.
 *
 * @argument Schema - The schema must be shared each PropertyDefinition in this array.
 */
export interface PropertyDefinitions<Schema> extends Array<PropertyDefinition<Schema, any>> {
}
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
export declare type PromiseyDataObject<T> = object & {
    [P in keyof T]: T[P] | PromiseLike<T[P]>;
};
export declare abstract class Barrel {
    abstract schemas: SchemaDefinitions<any>;
    batches: Array<BatchObject<any>>;
    dataObjects: Array<{}>;
    constructor();
    addSchema<T>(schemaName: string, schemaDefinition: SchemaDefinition): void;
    generateSingleBatch<T>(this: Barrel, schemaName: string, overrides?: Partial<T>, callback?: InsertFunctionCallback<T>): BatchObject<T>;
    generateManyBatches<T>(this: Barrel, schemaName: string, howMany: number, overrides?: Partial<T>, callback?: InsertFunctionCallback<T>): BatchObject<T>;
    createBatch<T>(this: Barrel, data: PromiseyDataObject<T> | Array<PromiseyDataObject<T>>, insertFunction: BatchInsertFunction<T>): BatchObject<T>;
    createDataObject<T>(this: Barrel, schemaName: string, overrides?: {
        [index: string]: any;
    }): PromiseyDataObject<T>;
    abstract createInsertFunction<T>(schemaName: string, callback?: InsertFunctionCallback<T>): BatchInsertFunction<T>;
    /**
     * Iterates through each batch, grabs the correct slice of data (from `dataObjects`)
     * and passes the data into the batch's `insertFunction`.
     *
     * @method insert
     * @async
     */
    insert(this: Barrel): Promise<void>;
    /**
     * Either invokes a function, passing in arbitrary params, or simply returns the value it was passed.
     * **not promise aware**
     *
     * @param this Barrel instance
     * @param value Either a function or constant value.
     * @param params Arbitrary number of params to pass to the value-function.
     */
    static _returnValue<ReturnType>(this: Barrel, value: ReturnType, ...params: any[]): any;
}
