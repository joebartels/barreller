import * as pgp from 'pg-promise';
export declare const connectionOptions: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
};
export declare function init(db: pgp.IDatabase<any>): Promise<void>;
export declare function teardown(db: pgp.IDatabase<any>): Promise<void>;
