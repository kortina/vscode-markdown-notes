module.exports = mentions;

function mentions() {
  // @ts-ignore
  var Parser = this.Parser;
  var tokenizers = Parser.prototype.inlineTokenizers;
  var methods = Parser.prototype.inlineMethods;

  // Add an inline tokenizer (defined in the following example).
  tokenizers.mention = tokenizeMention;

  // Run it just before `text`.
  methods.splice(methods.indexOf('text'), 0, 'mention');
}
tokenizeMention.notInLink = true;
tokenizeMention.locator = locateMention;

function tokenizeMention(eat: any, value: any, silent?: any) {
  var match = /^@(\w+)/.exec(value);

  if (match) {
    if (silent) {
      return true;
    }

    return eat(match[0])({
      type: 'link',
      url: 'https://social-network/' + match[1],
      children: [{ type: 'text', value: match[0] }],
    });
  }
}
function locateMention(value: any, fromIndex: any) {
  return value.indexOf('@', fromIndex);
}
