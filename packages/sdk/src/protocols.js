import { SlashAuth } from '@synonymdev/slashauth'

export const protocolsList = [SlashAuth]

/**
 * @type {{
 *  SlashAuth: typeof SlashAuth
 * }}
 */
// @ts-ignore
export const protocols = Object.fromEntries(
  protocolsList.map((p) => [p.name, p])
)
