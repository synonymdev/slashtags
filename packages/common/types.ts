type Serializable =
  | string
  | number
  | boolean
  | null
  | Array<string | number | null | boolean | null>
  | Record<string, string | number | null | boolean | null>;
