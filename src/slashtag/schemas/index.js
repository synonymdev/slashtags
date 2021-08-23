import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import base64url from 'base64url';

/**
 * @type {(schema: Serializable, data: Serializable)=> Serializable}
 */
export const validateRecord = (schema, data) => {
  const ajv = new Ajv({ allErrors: true, allowMatchingProperties: true });
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
 * Serialize a document into a base64url string using its schema.
 * @type {(schema: Serializable, record:Serializable)=>string}
 */
export const serializeRecord = (schema, record) =>
  base64url.encode(
    JSON.stringify(
      Object.keys(schema.properties)
        .sort((a, b) => (a > b ? 1 : -1))
        .map((key) =>
          schema.properties[key].type === 'object'
            ? serializeRecord(schema.properties[key], record[key])
            : record[key],
        ),
    ),
  );

/**
 * Serialize a document into a base64url string using its schema.
 * @type {(schema: Serializable, serialized:string, validate?: boolean)=>Serializable}
 */
export const parseRecord = (schema, serialized, validate = true) => {
  const list = JSON.parse(base64url.decode(serialized));

  const data = Object.fromEntries(
    Object.keys(schema.properties)
      .sort((a, b) => (a > b ? 1 : -1))
      .map((key, index) =>
        schema.properties[key].type === 'object'
          ? parseRecord(schema.properties[key], list[index], false)
          : [key, list[index]],
      ),
  );

  if (validate) validateRecord(schema, data);

  return data;
};
