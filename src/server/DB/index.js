import * as Slashtag from '../../slashtag/index.js';

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
 * @const {{slashtag: [key:string]: Serizlizeable}}
 */
const DB = InititalDB;

export const createDB = (did) => {
  /**
   * Returns a map of the record id and the record data after validation/modification.
   * @type {(schema: Serializable, data:Serializable)=> Serializable}
   */
  const saveRecord = (schema, data) => {
    if (!schema)
      throw new Error('Slashtag: schema is required to create a record');
    if (typeof schema === 'string') schema = readRecord('$schemas', schema);
    if (!schema) throw new Error('Slashtag: No schema found for ' + schema);

    Slashtag.schema.validate(schema, data);

    const schemaID = Slashtag.utils.recordID(schema);

    const appended = { [Slashtag.utils.recordID(data)]: data };

    DB.slashtag[schemaID] = {
      ...DB.slashtag[schemaID],
      ...appended,
    };

    return appended;
  };

  /**
   * @type {(schema: Serializable|string, dataID:string)=> Serializable}
   */
  const readRecord = (schema, dataID) => readSchemaRecords(schema)[dataID];

  /**
   * @type {(schema: Serializable|string)=> Serializable}
   */
  const readSchemaRecords = (schema) =>
    DB.slashtag[Slashtag.utils.recordID(schema)];

  return {
    get all() {
      return DB.slashtag;
    },
    saveRecord,
    readRecord,
    readSchemaRecords,
  };
};
