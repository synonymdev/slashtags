/**
 * @typedef SlashtagRecord
 * @type {{
 *  data: Serializable,
 *  metadata: {
 *      schema: string,
 *      tags?: string[]
 *  }
 * }}
 */

/**
 * @typedef Serializable
 * @type {
 *  | string
 *  | number
 *  | boolean
 *  | null
 *  | {[key: string]: string | number | boolean | null }
 *  | Array<string | number | boolean | null >
 * }
 */
