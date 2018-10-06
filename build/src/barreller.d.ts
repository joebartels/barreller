import * as pgp from 'pg-promise';
import { TConnectionParameters } from 'pg-promise/typescript/pg-subset';
import { ColumnsDefinition, RowObject, TableDefinition } from './types';
export declare class Barrel {
    tables: {
        [key: string]: TableDefinition;
    };
    readonly pgp: pgp.IMain;
    readonly db: pgp.IDatabase<any>;
    constructor(connect: TConnectionParameters);
    addTable(this: Barrel, tableName: string, columnValues: ColumnsDefinition): void;
    generateRow<T = RowObject>(this: Barrel, tableName: string, overrides?: RowObject): T;
    static _returnValue<ReturnType, AdditionalOptions>(value: ReturnType, ...params: AdditionalOptions[]): any;
}
