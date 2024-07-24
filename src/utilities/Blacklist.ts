const generateBadWordsRegex = (badWordsData: string[]): RegExp => {
  const regexPattern = badWordsData
    .map((word: string) => `(${word})`)
    .join('|');
  return new RegExp(regexPattern, 'gi');
};

const filterBadWords = (input: string, regex: RegExp) => {
  return input.replace(regex, (match) => '*'.repeat(match.length));
};

const getTextMessage = (regExp: RegExp | undefined, text: string): string => {
  if (!regExp || text.length === 0) return text;

  return filterBadWords(text, regExp);
};

export { getTextMessage, generateBadWordsRegex, filterBadWords };
