export function generateSequentialReference(refBefore = null) {
  if (refBefore === null) {
    refBefore = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  }
  if (refBefore.length !== 32) {
    throw new Error(`invalid reference length must be 32 chars length string`);
  }
  const letters = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
  ];
  const chars = refBefore.split('');
  const reversedChars = [...chars].reverse();
  const indexFromEndToIncrement = reversedChars.findIndex(
    (char) => char !== letters[letters.length - 1],
  );
  const indexedFromStartToIncrement = 31 - indexFromEndToIncrement;
  const replacement =
    letters[
      letters.findIndex(
        (letter) => letter === chars[indexedFromStartToIncrement],
      ) + 1
    ];
  chars[indexedFromStartToIncrement] = replacement;
  return chars.join('');
}
