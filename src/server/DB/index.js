import * as Slashtag from '../../slashtag/index.js';

/**
 * @const {{slashtag: [key:string]: Serizlizeable}}
 */
const InititalDB = {
  slashtag: {
    $schemas: Object.fromEntries(
      Object.values(Slashtag.constants.schemas).map((schema) => [
        Slashtag.utils.recordID(schema),
        schema,
      ]),
    ),
  },
};

/**
 * A temporary database for slashtag mvp.
 */
const DB = InititalDB;

export const createDB = (did) => {
  /**
   * Returns a map of the record id and the record data after validation/modification.
   * @type {(schema: Serializable, data:Serializable)=> Serializable}
   */
  const putRecord = (schema, data) => {
    if (!schema)
      throw new Error('Slashtag: schema is required to create a record');

    if (typeof schema === 'string') schema = getRecord('$schemas', schema);
    if (!schema) throw new Error('Slashtag: No schema found for ' + schema);

    Slashtag.schema.validateRecord(schema, data);

    const schemaID = Slashtag.utils.recordID(schema);

    const appended = { [Slashtag.utils.recordID(data)]: data };

    DB.slashtag[schemaID] = {
      ...DB.slashtag[schemaID],
      ...appended,
    };

    return appended;
  };

  /**
   * Returns a map of the schema id and the schema object after validation/modification.
   * @type {(schema: Serializable)=> Serializable}
   */
  const putSchema = (schema) => {
    Slashtag.schema.validateSchema(schema);

    const schemaID = '$schemas';

    const appended = { [Slashtag.utils.recordID(schema)]: schema };

    DB.slashtag[schemaID] = {
      ...DB.slashtag[schemaID],
      ...appended,
    };

    return appended;
  };

  /**
   * @type {(schema: Serializable|string, dataID:string)=> Serializable}
   */
  const getRecord = (schema, dataID) => getRecords(schema)[dataID];

  /**
   * @type {(schema: Serializable|string)=> Serializable}
   */
  const getRecords = (schema) => DB.slashtag[Slashtag.utils.recordID(schema)];

  // TODO: add remote resolution of schemas and records with validation.

  return {
    get all() {
      return DB.slashtag;
    },
    putSchema,
    putRecord,
    getRecord,
    getRecords,
  };
};
