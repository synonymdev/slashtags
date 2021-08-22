import * as Slashtag from './slashtag/index.js';
import { createDB } from './DB/index.js';

const log = (x, y) =>
  y
    ? console.log(x + ':', '\n', JSON.stringify(y, null, 2))
    : console.log(JSON.stringify(x, null, 2));

const db = createDB('did:example:something');

log(
  'Creating a record by its schema definition',
  db.saveRecord(Slashtag.schema.defaults.Account, {
    'RBNvo1WzZ4oRRq0W9-hknpT7T8If536DEMBg9hyq_4o':
      'RBNvo1WzZ4oRRq0W9-hknpT7T8If536DEMBg9hyq_4o',
  }),
);

db.saveRecord(Slashtag.schema.defaults.Account, {
  'RBNvo1WzZ4oRRq0W9-9kfpT7T8If536DEMBg9hyq_4o':
    'RBNvo1WzZ4oRRqdW9-hknpT7T8If536DEMBg9hyq_4o',
});

log('All the slashtag sub document', db.all);

log(
  'Getting a collection by its schema definition',
  db.readSchemaRecords(Slashtag.schema.defaults.Account),
);

log('Getting a collection by its schemaID', {
  schemaID: Slashtag.utils.recordID(Slashtag.schema.defaults.Account),
  result: db.readSchemaRecords(
    Slashtag.utils.recordID(Slashtag.schema.defaults.Account),
  ),
});

log('Creating a record using a schemaID', {
  schemaID: Slashtag.utils.recordID(Slashtag.schema.defaults.Account),
  result: db.saveRecord(
    Slashtag.utils.recordID(Slashtag.schema.defaults.Account),
    {},
  ),
});

log('Fetching the whole db', db.all);
