import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import base64url from 'base64url';

/**
 * @type {(schema: Serializable, data: Serializable, opts?: any)=> Serializable}
 */
export const validateRecord = (schema, data, opts = {}) => {
  const ajv = new Ajv({
    allErrors: true,
    allowMatchingProperties: true,
    removeAdditional: true,
    ...opts,
  });
  addFormats(ajv);

  ajv.validate(schema, data);
  if (ajv.errors)
    throw new Error(
      'Slashtag: Record validation errors:' +
        JSON.stringify(ajv.errors, null, 2),
    );

  return data;
};

/**
 * @type {(schema: Serializable)=> Serializable}
 */
export const validateSchema = (schema) => {
  const ajv = new Ajv({ allErrors: true });
  ajv.validateSchema(schema);
  if (ajv.errors)
    throw new Error(
      'Slashtag: schema validation errors:' +
        JSON.stringify(ajv.errors, null, 2),
    );

  return schema;
};

/**
 * @type {(schema: Serializable)=> boolean}
 */
const canOptimize = (schema) =>
  schema.properties &&
  !(
    schema.patternProperties ||
    schema.propertyNames ||
    schema.additionalProperties !== false
  );

/**
 * Serialize a document into a base64url string using its schema.
 * @type {(schema: Serializable, record:Serializable, validate?: boolean)=>string}
 */
export const serializeRecord = (schema, record) => {
  const result = base64url.encode(
    JSON.stringify(
      canOptimize(schema)
        ? Object.keys(schema.properties)
            .sort((a, b) => (a > b ? 1 : -1))
            .map((key) =>
              schema.properties[key].type === 'object'
                ? serializeRecord(schema.properties[key], record[key])
                : record[key],
            )
        : record,
    ),
  );

  return result;
};

/**
 * Serialize a document into a base64url string using its schema.
 * @type {(schema: Serializable, serialized:string, validate?: boolean)=>Serializable}
 */
export const parseRecord = (schema, serialized, nested = false) => {
  const list = JSON.parse(base64url.decode(serialized));

  const data = Object.fromEntries(
    canOptimize(schema)
      ? Object.keys(schema.properties)
          .sort((a, b) => (a > b ? 1 : -1))
          .map((key, index) =>
            schema.properties[key].type === 'object'
              ? [key, parseRecord(schema.properties[key], list[index], true)]
              : [key, list[index]],
          )
      : Object.entries(list),
  );

  console.log(data);
  if (!nested) validateRecord(schema, data);

  return data;
};
