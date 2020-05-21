import { Position } from 'vscode';

const unified = require('unified');
import { Node } from 'unist';
const markdown = require('remark-parse');
const wikiLinkPlugin = require('remark-wiki-link');
const remarkTagsPlugin = require('./remarkTagsPlugin');
const find = require('unist-util-find');
const visit = require('unist-util-visit');

type Tree = any; // FIXME: get proper type
type Processor = any; // FIXME: get proper type

export class RemarkParser {
  doc: string;
  treeParsed?: Tree;

  constructor(doc: string) {
    this.doc = doc;
  }

  static processor: Processor = unified()
    .use(markdown, { gfm: true })
    .use(wikiLinkPlugin)
    .use(remarkTagsPlugin);

  // memoize the parsing of this.doc
  tree(): Tree {
    if (!this.treeParsed) {
      this.treeParsed = RemarkParser.processor.parse(this.doc);
    }
    return this.treeParsed;
  }

  // Return the node of this.doc at that position
  getNodeAtPosition(position: Position): Node | undefined {
    // pass tree as arg instead?
    let nodes = find(this.tree(), (node: any) => {
      // https://github.com/syntax-tree/unist#position
      // The start field of Position represents the place of the first character of the parsed source region.
      // The end field of Position represents the place of the first character after the parsed source region, whether it exists or not.
      // The line field (1-indexed integer) represents a line in a source file.
      // The column field (1-indexed integer) represents a column in a source
      // file.
      let s = node.position.start;
      let e = node.position.end;
      // convert needle to 1 based instead of 0 based, to match unified node position syntax
      let needle = { line: position.line + 1, column: position.character + 1 };
      return s.line == needle.line && s.column <= needle.column && e.column >= needle.column;
    });
    if (nodes) {
      return nodes.first();
    }
  }

  walkWikiLinksAndTags() {
    visit(this.tree(), ['wikiLink', 'noteTag'], (node: Node) => {
      console.log(`---- ${node.type} ----`);
      console.log(`value: ${node.value}`);
      // console.log(node.position);
    });
  }
}
