// capitalize a single word
export const capitalize = (word: string): string => {
  if (!word) {
    return word;
  }
  return `${word[0].toUpperCase()}${word.slice(1)}`;
};

// take "a string in some case" to "A String in Title Case"
export const titleCase = (sentence: string): string => {
  if (!sentence) {
    return sentence;
  }
  const chicagoStyleNoCap = `
a aboard about above across after against along amid among an and anti around as at before behind
below beneath beside besides between beyond but by concerning considering despite down during except
excepting excluding following for from in inside into like minus near of off on onto opposite or
outside over past per plus regarding round save since so than the through to toward towards under
underneath unlike until up upon versus via with within without yet
  `.split(/\s/);
  let words = sentence.split(/\s/);
  return words
    .map((word, i) => {
      if (i == 0 || i == words.length - 1) {
        return capitalize(word);
      } else if (chicagoStyleNoCap.includes(word.toLocaleLowerCase())) {
        return word;
      } else {
        return capitalize(word);
      }
    })
    .join(' ');
};

// take some-filename-in-case to "Some Filename in Case" Title
export const titleCaseFromFilename = (filename: string): string => {
  if (!filename) {
    return filename;
  }
  return titleCase(
    filename
      .replace(/\.(md|markdown)$/, '')
      .replace(/[-_]/gi, ' ')
      .replace(/\s+/, ' ')
  );
};

export const padNumber = (val: number, len: number): string => {
  return val.toString().padStart(len, '0');
};