import { Eat } from 'remark-parse';
// See: https://unifiedjs.com/explore/package/remark-parse/
// See: https://github.com/remarkjs/remark/issues/387
// FIXME: this does not seem to be working correctly...

module.exports = remarkTagsPlugin;

function remarkTagsPlugin() {
  // @ts-ignore
  var Parser = this.Parser;
  var tokenizers = Parser.prototype.inlineTokenizers;
  var methods = Parser.prototype.inlineMethods;

  // Add an inline tokenizer (defined in the following example).
  tokenizers.tag = tokenizeTag;

  // Run it just before `text`.
  methods.splice(methods.indexOf('text'), 0, 'tag');
}
tokenizeTag.notInLink = true;
tokenizeTag.locator = locateTag;

function tokenizeTag(eat: any, value: any, silent?: any) {
  var match = /^#(\w+)/.exec(value);

  if (match) {
    if (silent) {
      return true;
    }

    return eat(match[0])({
      type: 'noteTag',
      value: match[0],
      valueNoHash: match[1],
      url: 'https://social-network/' + match[1],
      children: [{ type: 'text', value: match[0] }],
    });
  }
}
function locateTag(value: any, fromIndex: any) {
  return value.indexOf('#', fromIndex);
}
