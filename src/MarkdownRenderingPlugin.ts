import { MarkdownDefinitionProvider } from './MarkdownDefinitionProvider';
import { NoteWorkspace } from './NoteWorkspace';
import { RefType, refFromWikiLinkText } from './Ref';
import { workspace } from 'vscode';


// See also: https://github.com/tomleesm/markdown-it-wikilinks
// Function that returns a filename based on the given wikilink.
// Initially uses filesForWikiLinkRefFromCache() to try and find a matching file.
// If this fails, it will attempt to make a (relative) link based on the label given.
function generatePageNameFromLabel(label: string) {
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
function postProcessPageName(pageName: string) {
  return NoteWorkspace.stripExtension(pageName);
}

// Transformation that only gets applied to the link label (ex: the " Description goes here" part of [[test-file.md | Description goes here]])
function postProcessLabel(label: string) {
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
  return label;
}

export function pluginSettings(): any {
  return require("markdown-it-regexp")(
    new RegExp("\\[\\[([^sep\\]]+)(sep[^sep\\]]+)?\\]\\]".replace(/sep/g, NoteWorkspace.pipedWikiLinksSeparator())),
    (match: any, utils: any) => {
      let label = '';
      let pageName = '';
      let href = '';
      let htmlAttrs = [];
      let htmlAttrsString = '';
      const isSplit = !!match[2];
      if (isSplit) {
        if (NoteWorkspace.pipedWikiLinksSyntax() == 'desc|file') {  
          label = match[1];
          pageName = generatePageNameFromLabel(match[2].replace(new RegExp(NoteWorkspace.pipedWikiLinksSeparator()), ''));
        } else {
          label = match[2].replace(new RegExp(NoteWorkspace.pipedWikiLinksSeparator()), '');
          pageName = generatePageNameFromLabel(match[1]);
        }
        
      }
      else {
        label = match[1];
        pageName = generatePageNameFromLabel(label);
      }

      label = postProcessLabel(label);
      pageName = postProcessPageName(pageName);

      // make sure none of the values are empty
      if (!label || !pageName) {
        return match.input;
      }

      pageName = pageName.replace(/^\/+/g, '');
      href = "/" + pageName + `.${NoteWorkspace.defaultFileExtension()}`;
      href = utils.escape(href);

      htmlAttrs.push(`href="${href}"`);
      htmlAttrs.push(`data-href="${href}"`);
      htmlAttrsString = htmlAttrs.join(' ');
      
      return `<a ${htmlAttrsString}>${label}</a>`;
    }
  );
}
