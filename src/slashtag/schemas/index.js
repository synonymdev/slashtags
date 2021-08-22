import Ajv from 'ajv';
import addFormats from 'ajv-formats';

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
