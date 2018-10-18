## roadmap
- [x] finalize Barrel class API. Common methods may include:

  - [x] `addSchema<T>(name, schema): void` where the interface for schema depends on the driver being used (postgres, mongodb, etc.)
    - [x] `schema` is currently `{ tableName, columnValues, columnSet }` but columnSet is pg-promise specific

  - [x] `createDataObject<T>(schemaName, properties): RowObject<T>` which returns an object whose properties are either values or unresolved promises

  - [x] `createInsertFunction(tableName, callback?)`
    - abstract method must be implemented

  - [x] `generateSingleBatch<T>(schemaName, data: T|T[])`
    - inserts data into `this.dataObjects`
    - generates the insertFunction by calling `this.createInsertFunction`
    - inserts batch into `this.batches`
    - potentially this can inspect the most recent batch and if it has the same schemaName then the batches can be merged
      - although this can be problematic b/c the insertFunction may not be mergable...
      - if we can somehow compare insertFunctions to see if the batches are mergeable....

- [x] API for PostgresBarrel
  - [x] `generateRow(tableName, properties)`
    - invokes `createSingleRow` and `createBatch`, returning `batch`
  - [x] `generateRows(tableName, howMany, properties)`
    - invokes `createSingleRow` `howMay` times creating an array of data
    - invokes `createBatch` once, passing in the array of data
  - [x] `createInsertFunction(schemaName, callback)` must return a function that can handle recieving arrays of data and single objects. After the data is inserted, the callback (if provided) is invoked and passed the results of the insertion.
