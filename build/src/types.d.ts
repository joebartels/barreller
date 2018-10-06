import { TQueryColumns } from 'pg-promise';
export interface RowObject {
    [key: string]: string | number | boolean | void;
}
export interface ColumnValueFunction<ReturnValueType> {
    (obj: RowObject): ReturnValueType;
}
export interface ColumnValueFunction<ReturnValueType, AdditionalOptions = {}> {
    (obj: RowObject, options?: AdditionalOptions): ReturnValueType;
}
export interface ColumnDefinition<ReturnValueType = string | number | boolean | void> {
    name: string;
    value: ColumnValueFunction<ReturnValueType> | ReturnValueType;
    prop?: string;
}
export interface ColumnsDefinition extends Array<ColumnDefinition> {
    readonly [index: number]: ColumnDefinition;
}
export interface TableDefinition {
    tableName: string;
    columnValues: ColumnsDefinition;
    columnSet: TQueryColumns;
}
