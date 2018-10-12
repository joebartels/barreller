"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertModule = require("assert");
const assert = assertModule.strict;
const hasOwnProperty = Object.prototype.hasOwnProperty;
class Barrel {
    constructor() {
        // extending class should be more specific with value's Type
        this.schemas = {};
        // each batch holds information for what data to add to database and a function for adding the data.
        this.batches = [];
        // rows store the raw data (in memory for now)
        this.rows = [];
    }
    addSchema(schemaName, schemaDefinition) {
        this.schemas[schemaName] = schemaDefinition;
    }
}
exports.Barrel = Barrel;
//# sourceMappingURL=barrel.js.map