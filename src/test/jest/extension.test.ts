import 'jest';
import { foo, NoteWorkspace, PipedWikiLinksSyntax, SlugifyMethod } from '../../NoteWorkspace';
import { titleCaseFromFilename } from '../../utils';
import { Note } from '../../NoteParser';
import { RefType } from '../../Ref';
import { BibTeXCitations } from '../../BibTeXCitations';
// import { config } from 'process';

jest.mock('../../NoteWorkspace');

// set the NoteWorkspace cfg object in a test
// NB: anything not set will inherit from DEFAULT_CONFIG
const setConfig = (cfg: object) => {
  NoteWorkspace.cfg = () => {
    return {
      ...NoteWorkspace.DEFAULT_CONFIG,
      ...cfg,
    };
  };
};

// reset the cfg to DEFAULT_CONFIG before every test
beforeEach(() => {
  NoteWorkspace.cfg = () => {
    return NoteWorkspace.DEFAULT_CONFIG;
  };
  BibTeXCitations.cfg = () => {
    return {
      bibTeXFilePath: "test/library.bib"
    };
  };
});

test('foo', () => {
  expect(foo()).toBe(1);
});

describe('NoteWorkspace.slug', () => {
  test('slugifyMethod', () => {
    setConfig({ slugifyMethod: SlugifyMethod.github });
    expect(NoteWorkspace.noteFileNameFromTitle("Don't Let Go!!")).toEqual('dont-let-go.md');
    NoteWorkspace.slugifyMethod = (): string => SlugifyMethod.classic;
    expect(NoteWorkspace.noteFileNameFromTitle("Don't Let Go!!")).toEqual('don-t-let-go.md');
  });

  test('noteFileNameFromTitle', () => {
    setConfig({ slugifyCharacter: NoteWorkspace.SLUGIFY_NONE, lowercaseNewNoteFilenames: true });
    expect(NoteWorkspace.noteFileNameFromTitle('Some Title')).toEqual('some title.md');
    expect(NoteWorkspace.noteFileNameFromTitle('Some Title ')).toEqual('some title.md');
    setConfig({ slugifyCharacter: NoteWorkspace.SLUGIFY_NONE, lowercaseNewNoteFilenames: false });
    expect(NoteWorkspace.noteFileNameFromTitle('Some Title')).toEqual('Some Title.md');

    setConfig({ slugifyCharacter: '-', lowercaseNewNoteFilenames: true });
    expect(NoteWorkspace.noteFileNameFromTitle('Some " Title ')).toEqual('some-title.md');
    expect(NoteWorkspace.noteFileNameFromTitle('Šömè Țítlê')).toEqual('šömè-țítlê.md');
    expect(NoteWorkspace.noteFileNameFromTitle('題目')).toEqual('題目.md');
    expect(NoteWorkspace.noteFileNameFromTitle('Some \r \n Title')).toEqual('some-title.md');
    setConfig({ slugifyCharacter: '-', lowercaseNewNoteFilenames: false });
    expect(NoteWorkspace.noteFileNameFromTitle('Some " Title ')).toEqual('Some-Title.md');

    setConfig({ slugifyCharacter: '_', lowercaseNewNoteFilenames: true });
    expect(NoteWorkspace.noteFileNameFromTitle('Some   Title ')).toEqual('some_title.md');
    setConfig({ slugifyCharacter: '_', lowercaseNewNoteFilenames: false });
    expect(NoteWorkspace.noteFileNameFromTitle('Some   Title ')).toEqual('Some_Title.md');

    setConfig({ slugifyCharacter: '－', lowercaseNewNoteFilenames: true });
    expect(NoteWorkspace.noteFileNameFromTitle('Ｓｏｍｅ　Ｔｉｔｌｅ')).toEqual(
      'ｓｏｍｅ－ｔｉｔｌｅ.md'
    );
    expect(NoteWorkspace.noteFileNameFromTitle('Ｓｏｍｅ　Ｔｉｔｌｅ ')).toEqual(
      'ｓｏｍｅ－ｔｉｔｌｅ.md'
    );
    setConfig({ slugifyCharacter: '－', lowercaseNewNoteFilenames: false });
    expect(NoteWorkspace.noteFileNameFromTitle('Ｓｏｍｅ　Ｔｉｔｌｅ ')).toEqual(
      'Ｓｏｍｅ－Ｔｉｔｌｅ.md'
    );
  });
});

describe('NoteWorkspace.noteNamesFuzzyMatch', () => {
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
    expect(NoteWorkspace.noteNamesFuzzyMatch('[[链接]]', '链接.md')).toBeTruthy();

    setConfig({uniqueIdTemplate: '\\d{12}'});
    expect(NoteWorkspace.noteNamesFuzzyMatch('[[202405030000]]', '202405030000-wiki-ling.md')).toBeTruthy();
    // TODO: if we add support for #headings, we will want these tests to pass:
    // expect(NoteWorkspace.noteNamesFuzzyMatch('[[wiki-link.md#with-heading]]', 'wiki-link.md')).toBeTruthy();
    // expect(NoteWorkspace.noteNamesFuzzyMatch('[[wiki-link#with-heading]]', 'wiki-link.md')).toBeTruthy();
    // expect(NoteWorkspace.noteNamesFuzzyMatch('[[wiki link#with-heading]]', 'wiki-link.md')).toBeTruthy();
  });

  test('noteNamesFuzzyMatchSlashes', () => {
    expect(NoteWorkspace.normalizeNoteNameForFuzzyMatch('dir/sub/link-topic.md')).toEqual(
      'link-topic'
    );
    // lower case is expected because 'slugifyTitle' includes toLowerCase
    expect(NoteWorkspace.slugifyTitle('Link/Topic')).toEqual('link-topic');
    expect(NoteWorkspace.normalizeNoteNameForFuzzyMatchText('Link/Topic')).toEqual('link-topic');
    expect(NoteWorkspace.noteNamesFuzzyMatch('dir/sub/link-topic.md', 'Link/Topic')).toBeTruthy();
    expect(NoteWorkspace.noteNamesFuzzyMatch('dir/sub/Link-Topic.md', 'Link/Topic')).toBeTruthy();
    expect(NoteWorkspace.noteNamesFuzzyMatch('dir/sub/link-topic.md', 'link/topic')).toBeTruthy();
    expect(NoteWorkspace.noteNamesFuzzyMatch('dir/sub/Link-Topic.md', 'link/topic')).toBeTruthy();
    expect(NoteWorkspace.noteNamesFuzzyMatch('dir/sub/link-topic.md', 'Link/topic')).toBeTruthy();
    expect(NoteWorkspace.noteNamesFuzzyMatch('dir/sub/link-topic.md', 'link/Topic')).toBeTruthy();
    expect(NoteWorkspace.noteNamesFuzzyMatch('dir/sub/Link-Topic.md', 'Link/topic')).toBeTruthy();
    expect(NoteWorkspace.noteNamesFuzzyMatch('dir/sub/Link-Topic.md', 'link/Topic')).toBeTruthy();
  });

  test('noteNamesFuzzyMatch', () => {
    expect(NoteWorkspace._wikiLinkCompletionForConvention('toSpaces', 'the-note-name.md')).toEqual(
      'the note name'
    );
    expect(
      NoteWorkspace._wikiLinkCompletionForConvention('noExtension', 'the-note-name.md')
    ).toEqual('the-note-name');
    expect(
      NoteWorkspace._wikiLinkCompletionForConvention('rawFilename', 'the-note-name.md')
    ).toEqual('the-note-name.md');

    setConfig({uniqueIdTemplate: '\\d{12}'})
    expect(
      NoteWorkspace._wikiLinkCompletionForConvention('uniqueId', '202405022338-the-note-name.md')
    ).toEqual('202405022338');
    // TODO: how should this behaving with #headings?
  });
});

describe('NoteWorkspace.rx', () => {
  test('rxWikiLink', () => {
    let rx = NoteWorkspace.rxWikiLink();
    expect(('Some [[wiki-link]].'.match(rx) || [])[0]).toEqual('[[wiki-link]]');
    expect(('Some [[wiki link]].'.match(rx) || [])[0]).toEqual('[[wiki link]]');
    expect(('一段 [[链接]]。'.match(rx) || [])[0]).toEqual('[[链接]]');
    expect(('Some [[wiki-link.md]].'.match(rx) || [])[0]).toEqual('[[wiki-link.md]]');
    expect(('一段 [[链接.md]]。'.match(rx) || [])[0]).toEqual('[[链接.md]]');
    // TODO: this returns a match OK right now, but I think we will want to
    // modify the result to contain meta-data that says there is also a #heading / parses it out
    expect(('Some [[wiki-link.md#with-heading]].'.match(rx) || [])[0]).toEqual(
      '[[wiki-link.md#with-heading]]'
    );
    // Should the following work? It does....
    expect(('Some[[wiki-link.md]]no-space.'.match(rx) || [])[0]).toEqual('[[wiki-link.md]]');
    expect(('一段[[链接]]无空格。'.match(rx) || [])[0]).toEqual('[[链接]]');
    expect('Some [[wiki-link.md].').not.toMatch(rx);
  });

  test('rxTag', () => {
    let rx = NoteWorkspace.rxTag();
    // preceded by space:
    expect(('http://something/ something #draft middle.'.match(rx) || [])[0]).toEqual('#draft');
    expect(('http://something/ something #draft/tag middle.'.match(rx) || [])[0]).toEqual('#draft/tag');
    expect(('http://something/ something #draft/tag/id middle.'.match(rx) || [])[0]).toEqual('#draft/tag/id');
    expect(('http://something/ something #draft /tag/id middle.'.match(rx) || [])[0]).toEqual('#draft');
    expect(('http://something/ something end #draft'.match(rx) || [])[0]).toEqual('#draft');
    expect(('http://something/ something end #draft/id'.match(rx) || [])[0]).toEqual('#draft/id');
    expect(('http://something/ #draft.'.match(rx) || [])[0]).toEqual('#draft');
    // preceded by comma:
    expect((',#draft,'.match(rx) || [])[0]).toEqual('#draft');
    expect((',#draft/id,'.match(rx) || [])[0]).toEqual('#draft/id');
    // start of line:
    expect(('#draft start'.match(rx) || [])[0]).toEqual('#draft');
    expect(('#draft/id start'.match(rx) || [])[0]).toEqual('#draft/id');
    // the character before the match needs to be a space or start of line:
    expect('[site](http://something/#com).').not.toMatch(rx);
    expect('[site](http://something/#com/id).').not.toMatch(rx);
    expect('[site](https://something.com/?q=v#com).').not.toMatch(rx);
    expect('[site](https://something.com/?q=v#com/id).').not.toMatch(rx);
  });

  test('rxBeginTag', () => {
    let rx = NoteWorkspace.rxBeginTag();
    // preceded by space:
    expect((' #...'.match(rx) || [])[0]).toEqual('#');
    expect((' #draft...'.match(rx) || [])[0]).toEqual('#');
    // preceded by comma:
    expect((',#...'.match(rx) || [])[0]).toEqual('#');
    // start of line:
    expect(('#...'.match(rx) || [])[0]).toEqual('#');
    // the character before the match needs to be a space or start of line:
    expect('https://something.com/?q=v#com').not.toMatch(rx);
  });

  test('rxMarkdownHyperlink', () => {
    let rx = NoteWorkspace.rxMarkdownHyperlink();
    // "regular" use of link:
    expect(('Some link to [test](test.md).'.match(rx)|| [])[0]).toEqual('[test](test.md)');
    // no description:
    expect(('Some link to [](test.md).'.match(rx) || [])[0]).toEqual('[](test.md)');

    // empty link:
    expect('Some link to nowhere []().').not.toMatch(rx);

    // link to a website:
    expect('Some link to [google](https://google.com).').not.toMatch(rx);
  });
});

describe('BibTeXCitations', () => {
  test("rxBibTeX", () => {
    let rx = BibTeXCitations.rxBibTeX();

    // start of line
    expect(("@reference".match(rx) || [])[0]).toEqual("@reference");
    expect(("@author_title_2010".match(rx) || [])[0]).toEqual(
      "@author_title_2010"
    );

    // preceded by space:
    expect(
      ("http://something/ something @ref middle.".match(rx) || [])[0]
    ).toEqual("@ref");
    expect(("http://something/ something end @ref".match(rx) || [])[0]).toEqual(
      "@ref"
    );

    // preceded by comma:
    expect((",@ref,".match(rx) || [])[0]).toEqual("@ref");

    // at the end of sentence
    expect(("some @reference. another".match(rx) || [])[0]).toEqual("@reference");

    // at the end of string
    expect(("some @reference.".match(rx) || [])[0]).toEqual("@reference");

    // inside brackets with name supression
    expect(("some [-@reference]".match(rx) || [])[0]).toEqual("@reference");

    // inside brackets with name supression and semicolumn separator
    expect(("some [;-@reference]".match(rx) || [])[0]).toEqual("@reference");

    // inside brackets with name supression and preceded by space
    expect(("some [ -@reference]".match(rx) || [])[0]).toEqual("@reference");

    // inside brackets with name supression and preceded by space and semicolumn separator
    expect(("some [; -@reference]".match(rx) || [])[0]).toEqual("@reference");

    // inside brackets and preceded by space
    expect(("some [ @reference]".match(rx) || [])[0]).toEqual("@reference");

    // inside brackets and preceded by space and semicolumn separator
    expect(("some [; @reference]".match(rx) || [])[0]).toEqual("@reference");

    // inside brackets
    expect(("some [@reference]".match(rx) || [])[0]).toEqual("@reference");

    // inside brackets and preceded by semicolumn separator
    expect(("some [;@reference]".match(rx) || [])[0]).toEqual("@reference");

    // do not match email address
    expect("name@domain.com").not.toMatch(rx);
  });

  test("references", async () => {
    const refs = await BibTeXCitations.citations();
    expect(refs).toEqual([
      "clear_zettelkasten_2020",
      "kleppmann_designing_2016",
      "nagel_what_1974",
      "turing_computing_1950"
    ]);
  });
});

let document = `line0 word1
line1 word1 word2 
  [[test.md]]  #tag #another_tag  <- link at line2, chars 2-12
^ tags at line2 chars 15-19 and 21-32
[[test.md]] <- link at line4, chars 0-11
[[demo.md]] <- link at line5, chars 0-11
#tag word <- line 6, chars 0-3
# [[]] [[ <- line 7, empty refs
[](test-hyperlink.md) <- link at line8, chars 0-11
[]() [](`; // line 9, empty refs

describe('Note', () => {
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
    w = {
      word: 'test-hyperlink.md',
      hasExtension: true,
      type: RefType.Hyperlink,
      range: undefined,
    };
    ranges = Note.fromData(document)._rawRangesForWord(w);
    expect(ranges).toMatchObject([
      { start: {line: 8, character: 0}, end: {line: 8, character: 21} },
    ]);
  });

  test('Note.tagSet', () => {
    let tags = Note.fromData(document).tagSet();
    expect(tags).toEqual(new Set(['#another_tag', '#tag']));
  });
});

describe('NoteWorkspace.pipedWikiLinks', () => {
  beforeEach(() => {
    setConfig({
      allowPipedWikiLinks: true,
      pipedWikiLinksSyntax: PipedWikiLinksSyntax.descFile,
    });
  });

  test('cleanPipedWikiLinks', () => {
    expect(NoteWorkspace.cleanPipedWikiLink('description|file')).toEqual('file');
    expect(
      NoteWorkspace.cleanPipedWikiLink('description with lots of spaces, and other symbols|file.md')
    ).toEqual('file.md');
    expect(NoteWorkspace.cleanPipedWikiLink('description|file')).toEqual('file');

    // Odd case, but I suppose it should be treated
    expect(NoteWorkspace.cleanPipedWikiLink('description|file|but-with-a-pipe-symbol.md')).toEqual(
      'file|but-with-a-pipe-symbol.md'
    );
  });

  test('noteNamesFuzzyMatch, SlugifyMethod.github', () => {
    // inherit the config set in describe:beforeEach
    setConfig({
      ...NoteWorkspace.cfg(),
      slugifyMethod: SlugifyMethod.github,
    });
    expect(
      NoteWorkspace.noteNamesFuzzyMatch('filename.md', 'description|filename.md')
    ).toBeTruthy();
    expect(
      NoteWorkspace.noteNamesFuzzyMatch('filename.md', 'description |filename.md')
    ).toBeTruthy();
  });

  test('noteNamesFuzzyMatch, SlugifyMethod.classic', () => {
    // inherit the config set in describe:beforeEach
    setConfig({
      ...NoteWorkspace.cfg(),
      slugifyMethod: SlugifyMethod.classic,
    });
    expect(
      NoteWorkspace.noteNamesFuzzyMatch('filename.md', 'description|filename.md')
    ).toBeTruthy();
    expect(
      NoteWorkspace.noteNamesFuzzyMatch('filename.md', 'description |filename.md')
    ).toBeTruthy();
  });

  test('allowPipedWikiLinks false', () => {
    setConfig({
      allowPipedWikiLinks: false,
      pipedWikiLinksSyntax: PipedWikiLinksSyntax.descFile,
    });
    // Because of this change, these should not match anymore...
    expect(NoteWorkspace.noteNamesFuzzyMatch('filename.md', 'description|filename.md')).toBeFalsy();

    // ... And cleanPipedWikiLink should return the original string.
    expect(NoteWorkspace.cleanPipedWikiLink('description|file')).toEqual('description|file');
  });

  test('pipedWikiLinksSeparator custom', () => {
    setConfig({
      allowPipedWikiLinks: true,
      pipedWikiLinksSyntax: PipedWikiLinksSyntax.descFile,
      pipedWikiLinksSeparator: '@',
    });

    expect(
      NoteWorkspace.noteNamesFuzzyMatch('filename.md', 'description@filename.md')
    ).toBeTruthy();

    expect(NoteWorkspace.cleanPipedWikiLink('description@file')).toEqual('file');
  });

  test('PipedWikiLinksSyntax.fileDesc', () => {
    setConfig({
      allowPipedWikiLinks: true,
      pipedWikiLinksSyntax: PipedWikiLinksSyntax.fileDesc,
      pipedWikiLinksSeparator: '\\|',
    });

    expect(
      NoteWorkspace.noteNamesFuzzyMatch('filename.md', 'filename.md|description')
    ).toBeTruthy();

    expect(NoteWorkspace.cleanPipedWikiLink('file|description')).toEqual('file');
  });
});

describe('NoteWorkspace.newNoteContent', () => {
  const newNote = (template: string, title: string) => {
    setConfig({
      newNoteTemplate: template,
    });
    return NoteWorkspace.newNoteContent(title);
  };

  it('handles noteName tag', () => {
    const template = '# ${noteName}\n\nThis is ${noteName}';

    const content = newNote(template, 'this is my test note!');

    expect(content).toBe('# this is my test note!\n\nThis is this is my test note!');
  });

  it('handles escaped newlines', () => {
    const template = '# Title\\n\\nContent';

    const content = newNote(template, 'nevermind');

    expect(content).toBe('# Title\n\nContent');
  });

  it('handles timestamp', () => {
    const template = '# Title\n\nCreated: ${timestamp}\n';

    const content = newNote(template, 'nevermind');
    const regex = /# Title\n\nCreated: (.*)\n/;

    expect(content).toMatch(regex);
    const matches = regex.exec(content);
    const date1 = Date.parse(matches![1]);
    expect(date1).not.toBe(Number.NaN);
  });

  it('handles date', () => {
    const template = '# Title\nDate: ${date}\n';

    const content = newNote(template, 'nevermind');
    const d = (new Date().toISOString().match(/(\d{4}-\d{2}-\d{2})/) || '')[0];
    const dt = `Date: ${d}`;
    expect(content.includes(dt)).toBeTruthy();
  });
});

describe('utils', () => {
  test('titleCaseFromFilename', () => {
    expect(titleCaseFromFilename('the-heat-is-on.md')).toEqual('The Heat Is On');
    expect(titleCaseFromFilename('in-the-heat-of-the-night.md')).toEqual(
      'In the Heat of the Night'
    );
  });
});
