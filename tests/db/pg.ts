import * as pgp from 'pg-promise';

export const connectionOptions = () => {
  return {
    host: 'localhost',
    port: 5432,
    database: 'barreller_test',
    user: 'postgres',
    password: 'postgres'
  };
};

const TABLE_FOOD = `
  CREATE TABLE food(
    food_id   uuid          primary key,
    name      text          null,
    calories  int           null,
    vitamins  varchar(1)[]  null
  )`;

const TABLE_INGREDIENT = `
  CREATE TABLE ingredient(
    ingredient_id   uuid  primary key default uuid_generate_v4(),
    name            text  null
  )`;

const TABLE_FOOD_INGREDIENT = `
  CREATE TABLE food_ingredient(
    food_id         uuid      not null references food(food_id),
    ingredient_id   uuid      not null references ingredient(ingredient_id),
    milligrams      smallint  not null default 0
  )`;

export function init(db: pgp.IDatabase<any>) {
  return db.tx('barreller_test init()', async t => {

    // extensions
    console.debug('pg.init() -> CREATING EXTENSIONS');
    await t.none('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // drop tables
    console.debug('pg.init() -> DROPPING TABLES');
    await t.none('DROP TABLE IF EXISTS food_ingredient');
    await t.none('DROP TABLE IF EXISTS food');
    await t.none('DROP TABLE IF EXISTS ingredient');

    // create tables
    console.debug('pg.init() -> CREATING TABLES');
    await t.none(TABLE_FOOD);
    await t.none(TABLE_INGREDIENT);
    await t.none(TABLE_FOOD_INGREDIENT);
  });
}

export async function teardown(db: pgp.IDatabase<any>) {
  console.debug('pg.teardown() -> TRUNCATING TABLES');
  await db.none('truncate table food cascade');
  await db.none('truncate table ingredient cascade');
  await db.none('truncate table food_ingredient cascade');

  await db.$config.pgp.end();
}
