import path from 'path'
import os from 'os'

export function tmpdir () {
  return path.join(os.tmpdir(), 'drivestore-' + Math.random().toString(16).slice(2))
}
