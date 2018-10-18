import * as pgp from 'pg-promise';
import { TConnectionParameters } from 'pg-promise/typescript/pg-subset';
import { Barrel, BatchInsertFunction, InsertFunctionCallback, PropertyDefinition, PropertyDefinitions, PropertyValueFunction, SchemaDefinitions } from './barrel';
export declare type PGSchemaDefinition = {
    schemaName: string;
    tableName: string;
    properties: Array<PropertyDefinition<any, any>>;
    columnSet: pgp.ColumnSet;
};
export declare type PGTable<T> = {
    [P in keyof T]: T[P] | PropertyValueFunction<T, T[P]>;
};
export declare class PostgresBarrel extends Barrel {
    schemas: SchemaDefinitions<PGSchemaDefinition>;
    readonly pgp: pgp.IMain;
    readonly db: pgp.IDatabase<any>;
    constructor(connection: TConnectionParameters);
    addTable<T>(tableName: string, properties: PropertyDefinitions<T>): void;
    /**
     * @method createInsertFunction
     * @param schemaName - The schema to create an insert-function for
     * @param callback - Optional - Invoked after data is inserted. Supports promises
     */
    createInsertFunction<T>(tableName: string, callback?: InsertFunctionCallback<T>): BatchInsertFunction<T>;
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
    static references<T>(tableName: string, primaryKey: string): PropertyValueFunction<T, any>;
}
