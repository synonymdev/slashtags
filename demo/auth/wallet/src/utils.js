export const truncateMid = (pk) =>
  pk.slice(0, 9) + '...' + pk.slice(pk.length - 9);
