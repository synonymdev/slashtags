export const truncateMid = (pk, count = 9) =>
  pk.slice(0, count) + '...' + pk.slice(pk.length - count);
