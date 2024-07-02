function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    // eslint-disable-next-line no-bitwise
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function intToRGB(i: number) {
  // eslint-disable-next-line no-bitwise
  const c = (i & 0x00ffffff).toString(16).toUpperCase().padStart(6, '0');
  return `#${c}`;
}

export function randomColor(key: string): string {
  const hashedKey = hashCode(key);
  let color = intToRGB(hashedKey);

  // Ensure color is not white
  while (color === '#FFFFFF') {
    color = intToRGB(hashCode(color));
  }

  return color;
}
