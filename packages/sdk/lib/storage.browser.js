import RAM from 'random-access-memory'

/**
 * Default storage in browser environment.
 */
// TODO support browser storage OR storing to remote Slashtags desktop node.
export const defaultStorage = () => new RAM()
