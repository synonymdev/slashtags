import jayson from 'jayson';
import { ServerHypercore } from './server.js';

jayson.Server.interfaces.hypercore = ServerHypercore;

export const Server = jayson.Server;

export const Client = jayson.Client;
