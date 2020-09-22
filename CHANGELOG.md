# Changelog

## [v0.0.20](https://github.com/kortina/vscode-markdown-notes/releases/edit/v0.0.20) (2020-09-22)

**Fixes:**

- improve perf by respecting search.exclude, files.exclude, AND .gitignore
- addresses #90
- via https://github.com/microsoft/vscode/issues/48674

**Diff:**

https://github.com/kortina/vscode-markdown-notes/compare/4326868eca031f52d79b0d779347daadc57bbaea..a4e63d4fe734aca5025a707e7b1939efefd578d3

## [v0.0.19](https://github.com/kortina/vscode-markdown-notes/releases/edit/v0.0.19) (2020-09-17)

**Enhancements:**

- merge #85 - add setting `vscodeMarkdownNotes.slugifyMethod` - "classic" supports some options specific to Markdown Notes. "github-slugger" uses https://github.com/Flet/github-slugger and is compatible with foam, addresses: https://github.com/foambubble/foam/issues/240
- merge #87 - add `API.ts` with a 'beta' public API (subject to change), [one example function](https://github.com/kortina/vscode-markdown-notes/pull/87/files#diff-e24351dfe2836d766dcaa5d2873075ebR26):

```ts
let notes = await vscode.commands.executeCommand('vscodeMarkdownNotes.notesForWikiLink', 'demo');
```

- add a sync version of `filesForWikiLinkRef`, `filesForWikiLinkRefFromCache`
- merge #86 from @thomaskoppelaar (🙏🏿 🙏🏿 🙏🏿), with...
- `markdownItPlugins` rendering of wiki-links
- add setting: `vscodeMarkdownNotes.previewShowFileExtension` - Specifies whether or not to show the linked file's extension in the preview
- add setting: `vscodeMarkdownNotes.previewLabelStyling` - Changes how the link to a file should be shown, either with or without brackets

**Fixes:**

- (#88) fix bug with `jest-focused.sh` test runner and fix `test-at-line.ts` so it can parse typescript files

**Cleanup:**

- cleanup jest tests
- add `setConfig` helper to jest tests

**Diff:**

https://github.com/kortina/vscode-markdown-notes/compare/8efafabe9d299a7e2c1d34559764952aa338888c..4326868eca031f52d79b0d779347daadc57bbaea

## [v0.0.18](https://github.com/kortina/vscode-markdown-notes/releases/edit/v0.0.18) (2020-08-24)

Add `$date` var for use in `vscodeMarkdownNotes.newNoteTemplate`.

**Enhancements:**

- New `$date` template var will expand to `YYYY-MM-DD` format date.

**Diff:**

https://github.com/kortina/vscode-markdown-notes/compare/271cf75cc2311a120eabd08f060270f927c0e401..8efafabe9d299a7e2c1d34559764952aa338888c

## [v0.0.17](https://github.com/kortina/vscode-markdown-notes/releases/edit/v0.0.17) (2020-08-23)

Add `CompletionItem.documentation` to provide more details about completion options.

**Enhancements:**

- Set `CompletionItem.documentation` to the file contents, giving more detail to disambiguate between long / similar filenames. Closes #38. Tx @ahazxm
  - Add `vscodeMarkdownNotes.compileSuggestionDetails` setting, which determines whether to render the markdown in the `CompletionItem.documentation`
    - `true`: ![true](https://user-images.githubusercontent.com/24939578/90867513-13994e80-e3c8-11ea-9bb3-a98767796a2d.png)
    - `false`: ![false](https://user-images.githubusercontent.com/24939578/90867523-16943f00-e3c8-11ea-86e8-29b7bd0cc0b7.png)

**Diff:**

https://github.com/kortina/vscode-markdown-notes/compare/fa011bb64c363a05231a043f39f800e7497617a9..271cf75cc2311a120eabd08f060270f927c0e401

## [v0.0.16](https://github.com/kortina/vscode-markdown-notes/releases/edit/v0.0.16) (2020-08-21)

**Enhancements:**

- add setting `vscodeMarkdownNotes.newNoteDirectory`, can be set to:
  - `SAME_AS_ACTIVE_NOTE`
  - `WORKSPACE_ROOT`
  - or `subdirectory/path` in workspace root
- resolves #74

An example workspace config you might want to use to manage `_posts` on a jekyll blog:

```jsonc
{
  "vscodeMarkdownNotes.newNoteDirectory": "_posts",
  "vscodeMarkdownNotes.newNoteTemplate": "---\nlayout: post\ntitle: '${noteName}'\nauthor: kortina\n---\n\n"
}
```

**Diff:**

https://github.com/kortina/vscode-markdown-notes/compare/808af92c40676ab2a9ae1d1de3611a930c6c5818..fa011bb64c363a05231a043f39f800e7497617a9

## [v0.0.15](https://github.com/kortina/vscode-markdown-notes/releases/edit/v0.0.15) (2020-08-18)

**Fixes:**

Fix bug where `vscodeMarkdownNotes.triggerSuggestOnReplacement` was not registering.

Tx @Gh0u1L5 for #78.

## [v0.0.14](https://github.com/kortina/vscode-markdown-notes/releases/edit/v0.0.14) (2020-08-16)

Support `[[piped-wiki-links|with a description]]` and bugfixes.

**Enhancements:**

- Support a "piped wiki link" in either the [MediaWiki](https://meta.wikimedia.org/wiki/Help:Piped_link) (`[[file-name|Link Text]]`) or [Github Wiki](https://github.com/gollum/gollum/wiki#link-tag) (`[[Link Text|file-name]]`) style.
  - See the new settings:
    - `vscodeMarkdownNotes.allowPipedWikiLinks`
    - `vscodeMarkdownNotes.pipedWikiLinksSyntax`
    - `vscodeMarkdownNotes.pipedWikiLinksSeparator`
  - Tx to @thomaskoppelaar for #73

**Fixes:**

- Add support for unicode filenames. Tx @Gh0u1L5 for #69
  - also adds feature `triggerSuggestOnReplacement` (which I made a setting in #76)
- Bump lodash from 4.17.15 to 4.17.19 #64

**Diff:**

https://github.com/kortina/vscode-markdown-notes/compare/2cb1262cca8fa218fe6d38256a64fc3146983722..13b2464983b64a51ee58832759b1b9ec11a48ed8

## [v0.0.13](https://github.com/kortina/vscode-markdown-notes/releases/edit/v0.0.13) (2020-07-16)

Bugfix.

**Fixes:**

Fix https://github.com/kortina/vscode-markdown-notes/issues/58
when using `Go to Reference` outside `[[]]`, the `NULL_REF.type` will set to `RefType.WikiLink`, which causes the auto-complete for wiki links all the time. /tx @ahazxm

## [v0.0.12](https://github.com/kortina/vscode-markdown-notes/releases/edit/v0.0.12) (2020-07-12)

Configurable template for new notes.

**Enhancements:**

- Adds new config, `vscodeMarkdownNotes.newNoteTemplate`: Template for auto-created note files. Available tokens: ${noteName}, ${timestamp}. Timestamp is inserted in ISO format, i.e. 2020-07-09T05:29:00.541Z.

Tx @qbikez for #49 closes #48

## [v0.0.11](https://github.com/kortina/vscode-markdown-notes/releases/edit/v0.0.11) (2020-07-08)

Many bugfixes from [foam](https://github.com/foambubble/foam) community.

**Fixes:**

- fix bug where extension functionality would not work when editing files with language `mdx`. #51 closes #45
- fix bug where `[[Link/Topic]]` would not correctly find note namec `link-topic.md`. tx to @eBerdnA for #52 closes #50
- fix bug where all non-ASCII word characters would be replaced with `-` characters. tx to @digiguru for #53 closes #47

**Diff:**

https://github.com/kortina/vscode-markdown-notes/compare/4af718ecf037791507d0d67d59f97ee5b961cccb..43ca88c91653136330c18450fb0ad51698e7decf

## [v0.0.10](https://github.com/kortina/vscode-markdown-notes/releases/edit/v0.0.10) (2020-06-30)

Major refactor that should dramatically improve performance by caching results of parsing files in workspace for `[[wiki-links]]` and `#tags` (instead of re-parsing just-in-time, every time we want suggestions.)

**Enhancements:**

- cache results of parsing files in workspace. Closes #31
- support for `mdx` and `fountain` files and new config `vscodeMarkdownNotes.defaultFileExtension` allows you to set the extension that gets appended upon note creation. Closes #44 /ht @andermerwed

**Fixes:**

- newly created tags will be registered for auto-completion (once they file they are in is saved to disk). Closes #36 /ht @b3u
- line numbers are no longer off by one. Closes #35 /ht @b3u

**Cleanup:**

- remove unused `RemarkParser` stuff ( left in branch https://github.com/kortina/vscode-markdown-notes/tree/ak-remark-parser )
- renames for clarity:
  - `ReferenceSearch` to `NoteParser`
  - `ContextWord` to `Ref`
- cleanup / dry-up errant references to file extension match regexes, now at `_rxFileExtensions`

## [v0.0.9](https://github.com/kortina/vscode-markdown-notes/releases/edit/v0.0.9) (2020-05-31)

Major Refactor with regexes allowing wiki links w spaces and w/o extensions. Basic backlinks.

**Enhancements:**

- allow spaces in filename #12 /ht @lukakemperle @b3u @lukesmurray
- add configurable slug character: '-' or '\_' or 'NONE' #17 /ht @jli
- add a very basic **Backlinks Panel** #13 /tx @pomdtr @b3u @lukesmurray
- add a config option to complete wiki-links without the file-extension
- add a config option to complete wiki-links with spaces

**Cleanup:**

- try new wikilink regex a la `\[\[^\]]+\]`
- change file parsing from line/word loops to line/regex loop
- switch from mocha e2e testing to jest headless testing
- write regex tests
- remove old mocha e2e test harness into new branch since it's not working w jest
- determine if `wordPattern` mod is nec - this still seems to be the case. in `relativePaths` mode, you can type `.` and then trigger intellisense w the keyboard shortcut and get completions, but you don't get the completions automatically without modifying the `wordPattern`
- tests for `something#tag and https://example.com/#tag and something[[link]]`
- create adapter interface wrapping `vscode.getConfiguration` to enable test mocking

## [v0.0.8](https://github.com/kortina/vscode-markdown-notes/releases/edit/v0.0.8) (2020-05-27)

**Fixes:**

- #4 - gets References and Definitions working for `[[links-with-no-extension]]` Thanks @b3u for [comments / code snippets](https://github.com/kortina/vscode-markdown-notes/issues/4#issuecomment-628778993). Also thanks to @quickfold @lukesmurray @jay-pee for discussion on this thread
  - NB: will still need to add a setting where you can get completions without the extension, but this should be easy to do
- #28 - fixes bug with New Note command on Windows. Thanks @davovscapcom

**Cleanup:**

- #23 - major code cleanup, moving most code out of `extension.ts` into smaller files. Tx @b3u
- #24 - add `LICENSE.md`. Tx @kolloch @b3u
- spikes out using `remark` to parse AST for markdown files, but was a little slow (tx @lukesmurray for this idea). Did not end up using it in this release, BUT I do have an idea for how to update the workspace note parser that I think will (1) dramatically simplify things and (2) hopefully enable support for wiki links with space characters

Tx all for being part of discussion leading up to this release.

## [v0.0.7](https://github.com/kortina/vscode-markdown-notes/releases/edit/0.0.7) (2020-05-17)

**Fixes:**

- Fix Windows Bugs with Tag Reference Lookups, #22

## [v0.0.6](https://github.com/kortina/vscode-markdown-notes/releases/tag/v0.0.6) (2020-05-15)

**Enhancements:**

- add configuration for #[15: auto-create notes when using go to definition on missing wikilink](https://github.com/kortina/vscode-markdown-notes/pull/15) and merge in
- add `MarkdownReferenceProvider implements vscode.ReferenceProvider` for Peek / Go To References
- implement: #### Create New Note On Missing Go To Definition
- implement: #### Peek References to `[[wiki-link]]`
- implement: Find All Reference to `[[wiki-link]]`
- implement: Peek References to `#tag`
- implement: Find All References to `#tag`

**Cleanup:**

- add mocha test runner

## [v0.0.5](https://github.com/kortina/vscode-markdown-notes/releases/tag/v0.0.5) (2020-05-11)

**Fixes:**

- add range to each CompletionItem returned
- fixes known issue: "Filename completion seems to be triggering when not in the `[[` context."
- hopefully will resolve intermittent bug where no `#tag` suggestions are returned (when there should be).
- fix typos in README

**Cleanup:**

- upgrade to vsce 1.75.0

## [v0.0.4](https://github.com/kortina/vscode-markdown-notes/releases/tag/v0.0.4) (2020-04-18)

**Enhancements:**

- Scan all files in workspace for `#tag` words to provide autocomplete options for tags.

## [v0.0.3](https://github.com/kortina/vscode-markdown-notes/releases/tag/v0.0.3) (2020-04-14)

**Fixes:**

- typo `markdwon` was causing extension not to work for `.markdown` files (it would only work for `.md` files).

## [v0.0.2](https://github.com/kortina/vscode-markdown-notes/releases/tag/v0.0.2) (2020-02-22)

**Enhancements:**

- add command for quickly creating a new note

```json
    {
        "key": "alt+n",
        "command": "vscodeMarkdownNotes.newNote",
    },
```

## [v0.0.1](https://github.com/kortina/vscode-markdown-notes/releases/tag/v0.0.1) (2020-02-13)

- Initial Release
