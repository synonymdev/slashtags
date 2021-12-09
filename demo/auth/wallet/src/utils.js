export const truncateMid = (pk, num = 9) =>
  pk.slice(0, num) + '...' + pk.slice(pk.length - num);
