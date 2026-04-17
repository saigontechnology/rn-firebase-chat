export const generateBadWordsRegex = (badWordsData: string[]): RegExp => {
  const regexPattern = badWordsData
    .map((word: string) => `(${word})`)
    .join('|');
  return new RegExp(regexPattern, 'gi');
};

export const filterBadWords = (input: string, regex: RegExp): string => {
  return input.replace(regex, (match) => '*'.repeat(match.length));
};

export const getTextMessage = (
  regExp: RegExp | undefined,
  text: string
): string => {
  if (!regExp || text.length === 0) return text;
  return filterBadWords(text, regExp);
};
