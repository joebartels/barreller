import { BatchObject } from './types';
export declare class Barrel {
    schemas: {
        [index: string]: any;
    };
    batches: Array<BatchObject<any>>;
    rows: Array<{}>;
    constructor();
    addSchema<T>(schemaName: string, schemaDefinition: T): void;
}
