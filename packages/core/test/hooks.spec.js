import { expect } from 'aegir/utils/chai.js'
import slashtags from '../src/index.js'

describe('Hooks', () => {
  it('should await onReady hooks', async () => {
    const slash = slashtags()

    let waited = false

    async function a (slash, options) {
      slash.onReady(async () => {
        await new Promise((resolve) => {
          setTimeout(() => {
            waited = true
            resolve(null)
          }, 1000)
        })
      })
    }

    expect(waited).to.be.false()
    await slash.use(a).ready()
    expect(waited).to.be.true()
  })

  it('should await onReady hooks', async () => {
    const slash = slashtags()

    let waited = false

    async function a (slash, options) {
      slash.onClose(async () => {
        await new Promise((resolve) => {
          setTimeout(() => {
            waited = true
            resolve(null)
          }, 1000)
        })
      })
    }

    await slash.use(a).ready()
    expect(waited).to.be.false()
    await slash.close()
    expect(waited).to.be.true()
  })
})
