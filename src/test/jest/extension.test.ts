import 'jest';
import { foo, NoteWorkspace } from '../../NoteWorkspace';
import { titleCaseFilename } from '../../utils';
import { Note, NoteParser } from '../../NoteParser';
import { RefType } from '../../Ref';

jest.mock('../../NoteWorkspace');

beforeEach(() => {
  NoteWorkspace.cfg = () => {
    return NoteWorkspace.DEFAULT_CONFIG;
  };
});

test('foo', () => {
  expect(foo()).toBe(1);
});

test('noteFileNameFromTitle', () => {
  let orig = NoteWorkspace.slugifyChar;
  NoteWorkspace.slugifyChar = (): string => 'NONE';
  expect(NoteWorkspace.noteFileNameFromTitle('Some Title')).toEqual('Some Title.md');
  NoteWorkspace.slugifyChar = (): string => '-';
  expect(NoteWorkspace.noteFileNameFromTitle('Some " Title ')).toEqual('some-title.md');
  NoteWorkspace.slugifyChar = (): string => '_';
  expect(NoteWorkspace.noteFileNameFromTitle('Some   Title ')).toEqual('some_title.md');
  NoteWorkspace.slugifyChar = (): string => '-';
  expect(NoteWorkspace.noteFileNameFromTitle('タイトル')).toEqual('タイトル.md');
  NoteWorkspace.slugifyChar = (): string => '-';
  NoteWorkspace.slugifyChar = orig;
});

test('rxTagNoAnchors', () => {
  let rx = NoteWorkspace.rxTagNoAnchors();
  expect(('http://something/ something #draft middle.'.match(rx) || [])[0]).toEqual('#draft');
  expect(('http://something/ something end #draft'.match(rx) || [])[0]).toEqual('#draft');
  expect(('#draft start'.match(rx) || [])[0]).toEqual('#draft');
  expect(('http://something/ #draft.'.match(rx) || [])[0]).toEqual('#draft');
  // TODO: should this match or not?
  // expect('[site](http://something/#com).').not.toMatch(rx);
});

test('rxWikiLink', () => {
  let rx = NoteWorkspace.rxWikiLink();
  expect(('Some [[wiki-link]].'.match(rx) || [])[0]).toEqual('[[wiki-link]]');
  expect(('Some [[wiki link]].'.match(rx) || [])[0]).toEqual('[[wiki link]]');
  expect(('Some [[wiki-link.md]].'.match(rx) || [])[0]).toEqual('[[wiki-link.md]]');
  // TODO: this returns a match OK right now, but I think we will want to
  // modify the result to contain meta-data that says there is also a #heading / parses it out
  expect(('Some [[wiki-link.md#with-heading]].'.match(rx) || [])[0]).toEqual(
    '[[wiki-link.md#with-heading]]'
  );
  // Should the following work? It does....
  expect(('Some[[wiki-link.md]]no-space.'.match(rx) || [])[0]).toEqual('[[wiki-link.md]]');
  expect('Some [[wiki-link.md].').not.toMatch(rx);
});

test('noteNamesFuzzyMatch', () => {
  expect(
    NoteWorkspace.noteNamesFuzzyMatch('dir/sub/the-heat-is-on.md', 'the-heat-is-on.md')
  ).toBeTruthy();
  expect(
    NoteWorkspace.noteNamesFuzzyMatch('dir/sub/the-heat-is-on.md', 'the-heat-is-on')
  ).toBeTruthy();
  expect(
    NoteWorkspace.noteNamesFuzzyMatch('dir/sub/the-heat-is-on.markdown', 'the-heat-is-on')
  ).toBeTruthy();
  expect(NoteWorkspace.noteNamesFuzzyMatch('[[wiki-link.md]]', 'wiki-link.md')).toBeTruthy();
  expect(NoteWorkspace.noteNamesFuzzyMatch('[[wiki-link]]', 'wiki-link.md')).toBeTruthy();
  expect(NoteWorkspace.noteNamesFuzzyMatch('[[wiki link]]', 'wiki-link.md')).toBeTruthy();
  // TODO: if we add support for #headings, we will want these tests to pass:
  // expect(NoteWorkspace.noteNamesFuzzyMatch('[[wiki-link.md#with-heading]]', 'wiki-link.md')).toBeTruthy();
  // expect(NoteWorkspace.noteNamesFuzzyMatch('[[wiki-link#with-heading]]', 'wiki-link.md')).toBeTruthy();
  // expect(NoteWorkspace.noteNamesFuzzyMatch('[[wiki link#with-heading]]', 'wiki-link.md')).toBeTruthy();
});

test('noteNamesFuzzyMatch', () => {
  expect(NoteWorkspace._wikiLinkCompletionForConvention('toSpaces', 'the-note-name.md')).toEqual(
    'the note name'
  );
  expect(NoteWorkspace._wikiLinkCompletionForConvention('noExtension', 'the-note-name.md')).toEqual(
    'the-note-name'
  );
  expect(NoteWorkspace._wikiLinkCompletionForConvention('rawFilename', 'the-note-name.md')).toEqual(
    'the-note-name.md'
  );
  // TODO: how should this behaving with #headings?
});

test('titleCaseFilename', () => {
  expect(titleCaseFilename('the-heat-is-on.md')).toEqual('The Heat Is On');
  expect(titleCaseFilename('in-the-heat-of-the-night.md')).toEqual('In the Heat of the Night');
});

let document = `line0 word1
line1 word1 word2 
  [[test.md]]  #tag #another_tag  <- link at line2, chars 2-12
^ tags at line2 chars 15-19 and 21-32
[[test.md]] <- link at line4, chars 0-11
[[demo.md]] <- link at line5, chars 0-11
#tag word`; // line 5, chars 0-3

test('Note._rawRangesForWord', () => {
  let w = {
    word: 'test.md',
    hasExtension: true,
    type: RefType.WikiLink,
    range: undefined,
  };
  let ranges;
  ranges = Note.fromData(document)._rawRangesForWord(w);
  expect(ranges).toMatchObject([
    { start: { line: 2, character: 2 }, end: { line: 2, character: 13 } },
    { start: { line: 4, character: 0 }, end: { line: 4, character: 11 } },
  ]);
  w = {
    word: 'tag',
    hasExtension: true,
    type: RefType.Tag,
    range: undefined,
  };
  ranges = Note.fromData(document)._rawRangesForWord(w);
  expect(ranges).toMatchObject([
    { start: { line: 2, character: 15 }, end: { line: 2, character: 19 } },
    { start: { line: 6, character: 0 }, end: { line: 6, character: 4 } },
  ]);
  w = {
    word: 'another_tag',
    hasExtension: true,
    type: RefType.Tag,
    range: undefined,
  };
  ranges = Note.fromData(document)._rawRangesForWord(w);
  expect(ranges).toMatchObject([
    { start: { line: 2, character: 20 }, end: { line: 2, character: 32 } },
  ]);
});

test('Note.tagSet', () => {
  let tags = Note.fromData(document).tagSet();
  expect(tags).toEqual(new Set(['#another_tag', '#tag']));
});
