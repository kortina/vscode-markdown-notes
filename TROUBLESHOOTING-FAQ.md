# Troubleshooting / FAQ

- [Troubleshooting / FAQ](#troubleshooting--faq)
    - [Autocomplete / Intellisense is not working - why?](#autocomplete--intellisense-is-not-working---why)
    - [What other settings do you recommend when using this extension?](#what-other-settings-do-you-recommend-when-using-this-extension)
    - [Troubleshooting Checklist](#troubleshooting-checklist)
    - [New note is not working - why?](#new-note-is-not-working---why)
    - [How can I disable syntax highlighting for `@words` / pandoc-style citations?](#how-can-i-disable-syntax-highlighting-for-words--pandoc-style-citations)
    - [Known Issues](#known-issues)

### Autocomplete / Intellisense is not working - why?

**IMPORTANT**

Quick suggestions are NOT enabled by default in Markdown, so to get suggestions, you have to **manually** `triggerSuggest` (`⌃Space` by default) **OR** put this in settings.json:

```
"[markdown]": {
    "editor.quickSuggestions": true
}
```

### What other settings do you recommend when using this extension?

See the
[RECOMMENDED-SETTINGS](https://github.com/kortina/vscode-markdown-notes/blob/master/RECOMMENDED-SETTINGS.md)
doc.


### Troubleshooting Checklist


_Before filing a new issue, please try to verify if this is a workspace / configuration issue, or an extension / os issue:_

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

### New note is not working - why?

New Note works only when you are in a workspace. Look [here](https://stackoverflow.com/questions/44629890/what-is-a-workspace-in-visual-studio-code) for more information on workspaces in VS Code.

### How can I disable syntax highlighting for `@words` / pandoc-style citations?

If you wish to turn off the syntax highlighting for [pandoc-style citations](https://pandoc.org/MANUAL.html#extension-citations) which use the same syntax as `@username` handles (e.g. GitHub or Twitter), you can do so by overriding the color in your settings:

```json
"editor.tokenColorCustomizations": {
  "textMateRules": [
    {
      "scope": "support.function.text.markdown.notes.bibtex.key",
      "settings": {
        "foreground": "#ffffff"
      }
    },
  ],
}
```

### Known Issues

- The `ctrl+o` VSCodeVim jumplist shortcut does not return you to the correct place after using "Go to Definition" (`ctrl+]`): https://github.com/VSCodeVim/Vim/issues/3277 (The VSCode `Go Back` command (`ctrl+-`) does work, however.)
- This extension sets the `wordPattern` for 'markdown' in order to (1) enable proper completion of relative paths and (2) make it such that if you `cmd+shift+f` on a `#tag` the search will prefill with "#tag" and not just "tag":
  <br />`vscode.languages.setLanguageConfiguration('markdown', { wordPattern: /([\#\.\/\\\w_]+)/ });`
