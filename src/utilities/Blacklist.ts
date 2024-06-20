import badWords from '../bad_words/key.json';

interface BadWords {
  [key: string]: string[];
}

export const filterBadWords = (input: string, lang: string) => {
  const badWordsData: string[] = (badWords as BadWords)[lang] ?? badWords.en;

  const regexPattern = badWordsData
    .map((word: string) => `(${word})`)
    .join('|');
  const regex = new RegExp(regexPattern, 'gi');

  return input.replace(regex, (match) => '*'.repeat(match.length));
};
