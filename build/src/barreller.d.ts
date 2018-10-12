import * as pgp from 'pg-promise';
import { TConnectionParameters } from 'pg-promise/typescript/pg-subset';
import { BatchObject, ColumnDefinitions, InsertFunctionCallback, TableDefinitions } from './types';
export declare class Barrel {
    tables: TableDefinitions;
    batches: Array<BatchObject<any>>;
    rows: Array<{}>;
    readonly pgp: pgp.IMain;
    readonly db: pgp.IDatabase<any>;
    constructor(connect: TConnectionParameters);
    addTable<T>(this: Barrel, tableName: string, columnValues: ColumnDefinitions<T>): void;
    generateRow<T>(this: Barrel, tableName: string, overrides?: Partial<T>, callback?: InsertFunctionCallback<T>): T;
    /**
     * Given a `tableName`, a row-object is created using the `columnValues`
     * provided to `addTable(tableName, columnValues)`.
     *
     * @method createRowObject
     * @param tableName {string}
     * @param overrides {object}
     */
    createRowObject<T>(this: Barrel, tableName: string, overrides?: {
        [index: string]: any;
    }): T;
    insert(this: Barrel): Promise<void>;
    /**
     * @method createInsertFunction
     * @param tableName
     * @param data
     * @param callback Optional. When provided, the inserted row is passed into
     * the callback as the first parameter.
     * @returns An async function that inserts the row into the database.
     * @private
     */
    private createInsertFunction;
    static _returnValue<ReturnType>(this: Barrel, value: ReturnType, ...params: any[]): any;
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
    static references<T>(tableName: string, primaryKey: string): (this: Barrel, obj: Partial<T>, columnKey: string) => Promise<any>;
}
