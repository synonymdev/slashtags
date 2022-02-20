import { homedir } from 'os';
import fs from 'fs';

export const storageDirectory = async () => {
  const dir = homedir() + '/.slashtags';

  try {
    fs.readdirSync(dir);
  } catch (error) {
    fs.mkdirSync(dir);
  }

  return dir;
};
