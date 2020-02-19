# VS Code Markdown Notes

### dev

Run `npm install` first.

### Helpful Links

- completion: https://github.com/microsoft/vscode-extension-samples/blob/master/completions-sample/src/extension.ts
- syntax: https://flight-manual.atom.io/hacking-atom/sections/creating-a-legacy-textmate-grammar/

## Known Issues

- `ctrl+o` vscode vim jumplist does not work after a goto definition: https://github.com/VSCodeVim/Vim/issues/3277

## TODO:

- Provide better support for ignore patterns, eg, don't complete `file.md` if it is within `ignored_dir/`
- Should we support filename without extension, eg, assume `[[file]]` is a reference to `file.md`?
- Add syntax highlighting and search for `#tags`. See [also](https://stackoverflow.com/questions/60293955/is-cmdshiftf-in-vscode-supposed-to-respect-the-editor-wordseparators-setting)

## Development and Release

To create a new release,

```sh
npm install
# bump version number in package.json
npm run vpackage # package the release, creates ,vsix
npm run vpublish # publish to store, see https://code.visualstudio.com/api/working-with-extensions/publishing-extension
# Will prompt for Azure Devops Personal Access Token, get fresh one at:
# https://dev.azure.com/andrewkortina/
# On "Error: Failed Request: Unauthorized(401)"
# see: https://github.com/Microsoft/vscode-vsce/issues/11
# The reason for returning 401 was that I didn't set the Accounts setting to all accessible accounts.
```

To install the `vsix` locally:

1. Select Extensions `(Ctrl + Shift + X)`
2. Open `More Action` menu (ellipsis on the top) and click `Install from VSIX…`
3. Locate VSIX file and select.
4. Reload VSCode.
