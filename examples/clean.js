import fs from 'fs';
import path from 'path';
import os from 'os';

try {
  fs.rmSync(path.join(os.tmpdir(), 'slashtags-examples/'), {
    recursive: true,
  });
} catch (error) {}
