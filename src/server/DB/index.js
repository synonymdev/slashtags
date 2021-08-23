import * as Slashtag from '../../slashtag/index.js';
import { setupHyperBee } from './hyperbee.js';

/**
 * @const {{slashtag: [key:string]: Serizlizeable}}
 */
const inititalSchemas = Object.fromEntries(
  Object.values(Slashtag.constants.schemas).map((schema) => [
    Slashtag.utils.recordID(schema),
    schema,
  ]),
);

const addSlashtagDefaultSchemas = async (db) =>
  db.put('$schemas', inititalSchemas);

export const createDB = async () => {
  const db = await setupHyperBee();
  console.log('Hyperbee setup, feed:', db.feed);

  await addSlashtagDefaultSchemas(db);

  /**
   */
  const all = async () => {
    const result = {};
    for await (const { key, value } of db.createReadStream()) {
      result[key] = value;
    }
    return result;
  };

  /**
   * Returns a map of the record id and the record data after validation/modification.
   * @type {(schema: Serializable, data:Serializable)=> Promise<Serializable>}
   */
  const putRecord = async (schema, data) => {
    if (!schema)
      throw new Error('Slashtag: schema is required to create a record');

    if (typeof schema === 'string')
      schema = await getRecord('$schemas', schema);
    if (!schema) throw new Error('Slashtag: No schema found for ' + schema);

    Slashtag.schema.validateRecord(schema, data);

    const schemaID = Slashtag.utils.recordID(schema);

    const appended = { [Slashtag.utils.recordID(data)]: data };

    await db.put(schemaID, {
      ...(await getRecords(schemaID)),
      ...appended,
    });

    return appended;
  };

  /**
   * Returns a map of the schema id and the schema object after validation/modification.
   * @type {(schema: Serializable)=> Promise<Serializable>}
   */
  const putSchema = async (schema) => {
    Slashtag.schema.validateSchema(schema);

    const schemaID = '$schemas';

    const appended = { [Slashtag.utils.recordID(schema)]: schema };

    await db.put(schemaID, {
      ...(await getRecords(schemaID)),
      ...appended,
    });

    return appended;
  };

  /**
   * @type {(schema: Serializable|string, dataID:string)=> Promise<Serializable>}
   */
  const getRecord = async (schema, dataID) => {
    const coll = await getRecords(schema);
    return coll && coll[dataID];
  };

  /**
   * @type {(schema: Serializable|string)=> Promise<Serializable>}
   */
  const getRecords = async (schema) => {
    return { ...(await db.get(Slashtag.utils.recordID(schema))) }.value;
  };

  // TODO: add remote resolution of schemas and records with validation.

  return {
    all,
    putSchema,
    putRecord,
    getRecord,
    getRecords,
  };
};
