---
name: Bug report
about: Create a report to help us improve
title: ''
labels: ''
assignees: ''

---

_Troubleshooting: Before filing a new issue, please try to verify if this is a workspace / configuration issue, or an extension / os issue:_

- Checkout [the repo](https://github.com/kortina/vscode-markdown-notes): `git clone git@github.com:kortina/vscode-markdown-notes.git`
- Open the test notebook directory: `cd vscode-markdown-notes/test && code .`
- Open `top.md` in the test workspace in VS Code
- [ ] typing `[[t`,  _triggerSuggest_ (`⌃Space` by default) gives completions: `test.md`, `top.md`
- [ ] typing `[[s`,  _triggerSuggest_ (`⌃Space` by default) gives completions: `sub.md`, `sub2.md`
- [ ] typing `#a`,  _triggerSuggest_ (`⌃Space` by default) gives completions: `#another_tag`, `#tag`
- [ ] typing `[[test.md]]`, moving cursor over this word,  _peekDefinition_ (`⌥F12` by default) opens Peek Definition window
- Did your bug occur in the test directory?
  - [ ] Yes
  - [ ] No 

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
- Full path to workspace directory: [eg `/Users/kortina/notebook`]
- Full path to file editing: [eg `/Users/kortina/journal.md`]
- Full path to file whose name should be completing (or the file you are trying to Peek): [eg `/Users/kortina/books.md`] (if applicable)
- Full path to file containing tags that should be completing: [eg `/Users/kortina/gravitys-rainbow.md`] (if applicable)
- Tag you expected to autocomplete: [eg `#draft`]
- Your `vscodeMarkdownNotes.workspaceFilenameConvention` setting: [eg `uniqueFilenames` or `relativePaths`]

Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem. Animated gifs with a tool like [gifox](https://gifox.io/) are especially helpful.

**Versions**
 - OS: [eg macOS 10.15.3]
 - VS Code Version: [eg 1.44.10]
 - Extension Version: [eg 0.0.4]
