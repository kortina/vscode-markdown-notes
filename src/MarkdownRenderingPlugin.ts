import { MarkdownDefinitionProvider } from './MarkdownDefinitionProvider';
import { NoteWorkspace } from './NoteWorkspace';
import { RefType, refFromWikiLinkText } from './Ref';
import { workspace } from 'vscode';


// See also: https://github.com/tomleesm/markdown-it-wikilinks
// Function that returns a filename based on the given wikilink.
// Initially uses filesForWikiLinkRefFromCache() to try and find a matching file.
// If this fails, it will attempt to make a (relative) link based on the label given.
export function PageNameGenerator(label: string) {
  const ref = refFromWikiLinkText(label);
  const results = MarkdownDefinitionProvider.filesForWikiLinkRefFromCache(ref, null);

  // NB: it is kind of weird that we need to strip the extension here
  // to make noteFileNameFromTitle work,
  // but then noteFileNameFromTitle adds back the default extension...
  // Prolly will lead to some bugs, and maybe we should add an optional
  // extension argument to noteFileNameFromTitle...
  label = NoteWorkspace.stripExtension(label);

  // Either use the first result of the cache, or in the case that it's empty use the label to create a path
  let path = results.length != 0 ?
    workspace.asRelativePath(results[0].path, false) :
    NoteWorkspace.noteFileNameFromTitle(label);

  return path;
}

// Transformation that only gets applied to the page name (ex: the "test-file.md" part of [[test-file.md | Description goes here]]).
export function postProcessPageName(pageName: string) {
  return NoteWorkspace.stripExtension(pageName);
}

// Transformation that only gets applied to the link label (ex: the " Description goes here" part of [[test-file.md | Description goes here]])
export function postProcessLabel(label: string) {
  // Trim whitespaces
  label = label.trim();

  // De-slugify label into white-spaces
  label = label.split(NoteWorkspace.slugifyChar()).join(' ');

  if (NoteWorkspace.previewShowFileExtension()) {
    label += `.${NoteWorkspace.defaultFileExtension()}`;
  }

  switch (NoteWorkspace.previewLabelStyling()) {
    case '[[label]]':
      return `[[${label}]]`;
    case '[label]':
      return `[${label}]`;
    case 'label':
      return label;
  }
}

export function pluginSettings(): any {
  return require('@thomaskoppelaar/markdown-it-wikilinks')({
    generatePageNameFromLabel: PageNameGenerator,
    postProcessPageName: postProcessPageName,
    postProcessLabel: postProcessLabel,
    uriSuffix: `.${NoteWorkspace.defaultFileExtension()}`,
    description_then_file: NoteWorkspace.pipedWikiLinksSyntax() == 'desc|file',
    separator: NoteWorkspace.pipedWikiLinksSeparator(),
  });
}
