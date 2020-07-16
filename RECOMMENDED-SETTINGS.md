# Recommended Settings

- [Recommended Settings](#recommended-settings)
    - [VS Code User Settings](#vs-code-user-settings)
    - [VS Code Workspace Settings](#vs-code-workspace-settings)
    - [VsCode Vim Settings (from @lukesmurray)](#vscode-vim-settings-from-lukesmurray)

### VS Code User Settings

Quick suggestions are NOT enabled by default in Markdown, so to get suggestions, you have to **manually** `triggerSuggest` (`⌃Space` by default) **OR** put set `editor.quickSuggestions` to `true` in your `settings.json`:

```jsonc
  // vscode settings.json
  // The following settings will only apply to markdown files:
  "[markdown]": {
    // quickSuggestions true will provide suggestions as you type.
    // If you turn this on and DO NOT want suggestions
    // for non-wiki-link, non-tag words,
    "editor.quickSuggestions": true,
    // This is poorly documented, but seems to offer suggestions
    // from any word in open document when turned on, which
    // can be a little distracting in markdown docs:
    "editor.wordBasedSuggestions": false,
    "editor.tabSize": 2,
    // Set this to false if you turn on quickSuggestions
    // but don't want suggestions for markdown related snippets
    // as you type:
    "editor.suggest.showSnippets": false,
  },
```

### VS Code Workspace Settings

```jsonc
{
  // save files after a delay automatically
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  // sort the explorer by modified date in descending order
  "explorer.sortOrder": "modified",
  // open files as tabs
  "workbench.editor.enablePreview": false,
  // reveal existing files if they are open (avoids tons of tabs)
  "workbench.editor.revealIfOpen": true,
  // open files from quick open as tabs
  "workbench.editor.enablePreviewFromQuickOpen": false
}
```

### VsCode Vim Settings (from @[lukesmurray](https://github.com/lukesmurray))

"This is the kitchen sink of settings I use." - @lukesmurray

```jsonc
    "vim.normalModeKeyBindingsNonRecursive": [
    // open references panel with gr
    {
      "before": ["g", "r"],
      "commands": ["references-view.find"]
    },
    // peek references inline with gR
    {
      "before": ["g", "R"],
      "commands": ["editor.action.referenceSearch.trigger"]
    },
    // open definition in new editor group with gs
    {
      "before": ["g", "s"],
      "commands": ["editor.action.revealDefinitionAside"]
    },
    {
      // peek definition inline with gD
      "before": ["g", "D"],
      "commands": ["editor.action.peekDefinition"]
    },
    // open link with gx
    {
      "before": ["g", "x"],
      "commands": ["editor.action.openLink"]
    }
  ],
```
