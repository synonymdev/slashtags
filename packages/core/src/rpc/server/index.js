import jayson from 'jayson';
import { ServerHypercore } from './hypercore.js';

jayson.Server.interfaces.hypercore = ServerHypercore;

export const Server = jayson.Server;
