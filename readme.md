## Barreller
Ever wanted to populate a postgres db with tons of fake data? Well, barreller does that.

Barreller prescribes a way to define your tables, column values, and relationships, and then import infinite data into postgres.

Inspiration came from wanting to create lots of fake data, but being constained by
maintaining the relationships between that data. Especially when sometimes those relationships depend on server-side generated primary keys.

As of this writing - very much a Work In Progress... But it does work!

### Example usage:
```ts
// define the type for the table
type Food = {
  foodId: string;
  calories: number;
}

// define a column
const foodColumnId = ColumnDefinition<FoodTable, 'foodId'> = {
  // name equals the table's column name
  name: 'food_id',

  // prop is optional and will be the key used when generating the data locally
  prop: 'foodId',

  // value can be a constant (i.e. a string, number, void, date, etc.)
  // or it can be a function and is invoked each time a row is generated
  value() { return faker.random.word(); }
};

const foodColumns = ColumnDefinitions<FoodTable> = [
  foodColumnId
];

const barrel = new Barrel({ pgConnectionObject });

// 'food' is the table name and it is also the string used to generate rows
barrel.addTable('food', foodColumns);

// this queues up the data to be inserted, but does NOT insert it
barrel.generateRow('food');

// inserts any queued up data. This is an async function.
barrel.insert();

```


### TODO
- [ ] finish the abstract Barrel class
- [ ] convert current Barrel class to PostgresBarrel as subclass of Barrel
- [ ]
