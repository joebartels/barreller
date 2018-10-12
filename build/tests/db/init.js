"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionOptions = {
    host: 'localhost',
    port: 5432,
    database: 'barreller_test',
    user: 'postgres',
    password: 'postgres'
};
const TABLE_FOOD = `
  CREATE TABLE food(
    food_id   uuid          primary key,
    name      text          null,
    calories  int           null,
    vitamins  varchar(1)[]  null
  )`;
function init(db) {
    return db.tx('barreller_test init()', async (t) => {
        // extensions
        await t.none('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        // drop tables
        await t.none('DROP TABLE IF EXISTS food');
        // create tables
        console.log('INSERTING TABLE');
        await t.none(TABLE_FOOD);
    });
}
exports.init = init;
async function teardown(db) {
    await db.$config.pgp.end();
}
exports.teardown = teardown;
//# sourceMappingURL=init.js.map