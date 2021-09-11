import Ajv from 'ajv'
import { metaschema } from '../src/constants/actions/metaschema.js'
import { schemasList } from '../src/constants/actions/schemas.js'
import addFormats from 'ajv-formats'
import * as DocID from '@synonymdev/slashtags-docid'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

console.log('Validating actions schemas')
schemasList.forEach((schema, index) => {
  console.log(`${index} - ${schema.title}`)
  console.log('    actionID: ' + DocID.toString(DocID.CID.fromJSON(schema)))
  try {
    ajv.validate(metaschema, schema)
  } catch (error) {
    console.log(ajv.errors, error)
  }

  if (ajv.errors) {
    console.dir(ajv.errors, { depth: null })
    throw new Error('Invalid schema')
  }
})

console.log('All action shcemas are valid')
