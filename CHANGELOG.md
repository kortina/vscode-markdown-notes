# Changelog

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
- add configurable slug character: '-' or '_' or 'NONE' #17 /ht @jli
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