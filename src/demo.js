import * as Slashtag from './slashtag/index.js';
import { createDB } from './server/DB/index.js';

const log = (x, y) =>
  y
    ? console.log(x + ':', '\n', JSON.stringify(y, null, 2))
    : console.log(JSON.stringify(x, null, 2));

const db = createDB('');

const createAndReadRecords = () => {
  log('==== Creating records ====');

  try {
    db.putRecord(Slashtag.constants.schemas.Account, { foo: 'b4r' });
  } catch (error) {
    console.log(error.message);
  }

  log('Creating a record using a schemaID', {
    schemaID: Slashtag.utils.recordID(Slashtag.constants.schemas.Account),
    result: db.putRecord(
      Slashtag.utils.recordID(Slashtag.constants.schemas.Account),
      {},
    ),
  });

  log(
    'Creating a record by its schema definition',
    db.putRecord(Slashtag.constants.schemas.Account, {
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
    db.getRecords(Slashtag.constants.schemas.Account),
  );

  log('Retrieving the whole db', db.all);
};

const createAndReadSchemas = () => {
  log('==== Creating Schemas ====');

  try {
    db.putSchema({ type: 'invalid' });
  } catch (error) {
    console.log(error.message);
  }

  log('Creating a schema', {
    schemaID: Slashtag.utils.recordID(Slashtag.constants.schemas.Account),
    result: db.putSchema({ title: 'Test schema' }),
  });

  log('Retrieving a schema by its schemaID', {
    schemaID: Slashtag.utils.recordID({ title: 'Test schema' }),
    result: db.getRecord(
      '$schemas',
      Slashtag.utils.recordID({ title: 'Test schema' }),
    ),
  });

  log('Retrieving all $schemas', db.all.$schemas);
};

const account = () => {
  log('==== Account ====');
  log(
    'Create an account document',
    db.putRecord(Slashtag.constants.schemas.Account, {
      [Slashtag.utils.recordID({ foo: 'b4r' })]: Slashtag.utils.recordID({
        answer: 42,
      }),
    }),
  );
};

const tagging = () => {
  log('==== Tagging ====');
  const someRecord = db.putRecord({}, {});
  log('Create some document', someRecord);
  log(
    'Tag a record as a hyper feed',
    db.putRecord(Slashtag.constants.schemas.Tags, {
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
    db.putRecord(Slashtag.constants.schemas.Tags, {
      uri: 'https://www.thebiz.pro/',
      tags: ['bitcoin', 'podcast'],
    }),
  );
};

const rating = () => {
  log('==== Rating ====');
  log(
    'Rate a resource with any uri',
    db.putRecord(Slashtag.constants.schemas.Rating, {
      uri: 'https://www.thebiz.pro',
      rating: 99,
    }),
  );

  const someRecord = db.putRecord(
    {},
    {
      foo: 'b4r',
    },
  );
  log('Create some document', someRecord);

  log(
    'Rate a resource with the proposed slashtag uri',
    db.putRecord(Slashtag.constants.schemas.Rating, {
      uri: Slashtag.utils.slashtagURI(
        Slashtag.utils.recordID({}),
        Object.keys(someRecord)[0],
        'foo',
      ),
      rating: 99,
    }),
  );
};

// createAndReadRecords();
// createAndReadSchemas();
// account();
// tagging();
// rating();
