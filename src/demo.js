import * as Slashtag from './slashtag/index.js';
import { createDB } from './server/DB/index.js';
import base64url from 'base64url';
import { serializeRecord } from './slashtag/schemas/index.js';

const log = (x, y) =>
  y
    ? console.log(x + ':', '\r', JSON.stringify(y, null, 2))
    : console.log(JSON.stringify(x, null, 2));

const main = async () => {
  const db = await createDB();

  const createAndReadRecords = async () => {
    log('==== Creating records ====');

    try {
      await db.putRecord(Slashtag.constants.schemas.Account, { foo: 'b4r' });
    } catch (error) {
      console.log(error.message);
    }

    log('Creating a record using a schemaID', {
      schemaID: Slashtag.utils.recordID(Slashtag.constants.schemas.Account),
      result: await db.putRecord(
        Slashtag.utils.recordID(Slashtag.constants.schemas.Account),
        {},
      ),
    });

    log(
      'Creating a record by its schema definition',
      await db.putRecord(Slashtag.constants.schemas.Account, {
        'RBNvo1WzZ4oRRq0W9-hknpT7T8If536DEMBg9hyq_4o':
          'RBNvo1WzZ4oRRq0W9-hknpT7T8If536DEMBg9hyq_4o',
      }),
    );

    log('Retrieving a collection by its schemaID', {
      schemaID: Slashtag.utils.recordID(Slashtag.constants.schemas.Account),
      result: db.getRecords(
        Slashtag.utils.recordID(Slashtag.constants.schemas.Account),
      ),
    });

    log(
      'Retrieving a collection by its schema definition',
      await db.getRecords(Slashtag.constants.schemas.Account),
    );

    const records = await db.all();
    delete records.$schemas;

    log('Retrieving all records', records);
  };

  const createAndReadSchemas = async () => {
    log('==== Creating Schemas ====');

    try {
      await db.putSchema({ type: 'invalid' });
    } catch (error) {
      console.log(error.message);
    }

    log('Creating a schema', {
      schemaID: Slashtag.utils.recordID(Slashtag.constants.schemas.Account),
      result: await db.putSchema({ title: 'Test schema' }),
    });

    log('Retrieving a schema by its schemaID', {
      schemaID: Slashtag.utils.recordID({ title: 'Test schema' }),
      result: await db.getRecord(
        '$schemas',
        Slashtag.utils.recordID({ title: 'Test schema' }),
      ),
    });

    log('Retrieving all $schemas', (await db.all()).$schemas);
  };

  const account = async () => {
    log('==== Account ====');
    log(
      'Create an account document',
      await db.putRecord(Slashtag.constants.schemas.Account, {
        [Slashtag.utils.recordID({ foo: 'b4r' })]: Slashtag.utils.recordID({
          answer: 42,
        }),
      }),
    );
  };

  const tagging = async () => {
    log('==== Tagging ====');
    const someRecord = await db.putRecord({}, {});
    log('Create some document', someRecord);
    log(
      'Tag a record as a hyper feed',
      await db.putRecord(Slashtag.constants.schemas.Tags, {
        uri:
          'hyper://_feedkey_/' +
          Slashtag.utils.recordID({}) +
          '/' +
          Object.keys(someRecord)[0] +
          '/',
        tags: ['test', 'podcast'],
      }),
    );

    log(
      'Tag arbitrary URI',
      await db.putRecord(Slashtag.constants.schemas.Tags, {
        uri: 'https://www.thebiz.pro/',
        tags: ['bitcoin', 'podcast'],
      }),
    );
  };

  const rating = async () => {
    log('==== Rating ====');
    log(
      'Rate a resource with any uri',
      await db.putRecord(Slashtag.constants.schemas.Rating, {
        uri: 'https://www.thebiz.pro',
        rating: 99,
      }),
    );

    const someRecord = await db.putRecord(
      {},
      {
        foo: 'b4r',
      },
    );
    log('Create some document', someRecord);

    log(
      'Rate a resource with the proposed slashtag uri',
      await db.putRecord(Slashtag.constants.schemas.Rating, {
        uri: Slashtag.utils.slashtagURI(
          Slashtag.utils.recordID({}),
          Object.keys(someRecord)[0],
          'foo',
        ),
        rating: 99,
      }),
    );
  };

  const serialize$parseRecord = async () => {
    log('==== Serializing a record using its schema ====');
    /**
     * @type {any}
     */
    let schema = {
      title: 'something',
      description: 'something else',
      type: 'object',
      properties: {
        first_name: { type: 'string' },
        last_name: { type: 'number' },
        registered: { type: 'boolean' },
        metadata: {
          type: 'array',
          items: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
          minItems: 2,
          additionalItems: false,
        },
        friend: {
          type: 'object',
          properties: {
            first_name: { type: 'string' },
            last_name: { type: 'number' },
            registered: { type: 'boolean' },
            metadata: {
              type: 'array',
              items: [
                { type: 'string' },
                { type: 'number' },
                { type: 'boolean' },
              ],
              minItems: 2,
              additionalItems: false,
            },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    };

    /**
     * @type {any}
     */
    let data = {
      first_name: 'foo',
      last_name: 42,
      registered: true,
      metadata: ['bar', 2, false],
      friend: {
        first_name: 'foo',
        last_name: 42,
        registered: false,
        metadata: ['bar', 2, false],
        ignored: true,
      },
      ignored: true,
    };

    const serializedRecord = Slashtag.schema.serializeRecord(schema, data);

    log('JSON stringify', JSON.stringify(data));
    log('Serialize a record with its schema', serializedRecord);
    log(
      'Parse a record with its schema',
      Slashtag.schema.parseRecord(schema, serializedRecord),
    );

    log('==== Can not optimize because property name patterns ====');
    schema = Slashtag.constants.schemas.Account;
    data = {
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    };
    let serialized = Slashtag.schema.serializeRecord(
      Slashtag.constants.schemas.Account,
      data,
    );
    log('Serialized Account', serialized);
    log('stringified', base64url.decode(serialized));
    log('parsed', Slashtag.schema.parseRecord(schema, serialized));

    log('==== Can not optimize because additional properties allowed ====');
    schema = {
      $schema: '',
      type: 'object',
      properties: {
        nested: {
          type: 'object',
          properties: { foo: { type: 'string' } },
          additionalProperties: false,
        },
      },
      additionalProperties: true,
    };
    serialized = Slashtag.schema.serializeRecord(schema, {
      foo: 'b4r',
      nested: { foo: 'nope' },
    });
    log('Serialized', serialized);
    log('stringified', base64url.decode(serialized));
    log('parsed', Slashtag.schema.parseRecord(schema, serialized));

    log('==== Can optimize on top level but not nested ====');
    schema = {
      $schema: '',
      type: 'object',
      properties: {
        foo: { type: 'string' },
        nested: {
          type: 'object',
          properties: { foo: { type: 'string' } },
        },
      },
      additionalProperties: false,
    };
    serialized = Slashtag.schema.serializeRecord(schema, {
      foo: 'b4r',
      nested: { foo: 'nope' },
    });
    log('Serialized', serialized);
    log('stringified', base64url.decode(serialized));
    log('stringified', Slashtag.schema.parseRecord(schema, serialized));
  };

  // await createAndReadRecords();
  // await createAndReadSchemas();
  // await account();
  // await tagging();
  // await rating();
  // await serialize$parseRecord();
};

main();
