import Ajv from 'ajv';

/**
 * @type {(schema: Serializable, data: Serializable)=> Serializable}
 */
export const validate = (schema, data) => {
  const ajv = new Ajv({ allErrors: true, allowMatchingProperties: true });
  ajv.validate(schema, data);
  if (ajv.errors)
    throw new Error(
      'Slashtag: Record validation errors:' +
        JSON.stringify(ajv.errors, null, 2),
    );

  return data;
};
