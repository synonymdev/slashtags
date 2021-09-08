import * as varint from './src/functions/varint.js';

const bytes = new TextEncoder().encode(
  'arsodnoarenoraesndoarisentoareisntowafendowfendoarsentoaesisnvoarisendoairesndoariesntoarisetnoarisentaorisendoarisentoarisntarsotiaresntoairesntoiarestnoariestnaroisentoarisentoairsntaorisentoa',
);
const ints = [1, 234, 45, 4, 6];

new Array(1000000).fill(0).forEach(() => {
  varint.prepend(ints, bytes);
});

console.log(varint.prepend(ints, bytes));
