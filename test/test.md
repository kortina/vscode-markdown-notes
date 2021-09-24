# test

- [[test]] - no extension
- [[test.md]] - extension, exists
- [[test-file.md]] - extension, does not exist
- [[../src/extension.ts]] - not a markdown extension
- [[./sub/sub.md]] - relative path, exists
- [[sub.md]] - exists in sub directory
- [[extension test mirror]]
- [[extension-test-mirror.md]]
- [](test) - hyperlink (should show up in the backlinks panel) - Note: autocompletion or file creation is not handled by this extension.

#tag #another_tag

An article by @turing_computing_1950

blabla [@turing_computing_1950;@turing_computing_1950;@turing_computing_1950] blabla
blabla [@turing_computing_1950; @turing_computing_1950; @turing_computing_1950] blabla
blabla [ @turing_computing_1950; @turing_computing_1950; @turing_computing_1950] blabla
blabla [ @turing_computing_1950;-@turing_computing_1950; @turing_computing_1950] blabla
blabla [ @turing_computing_1950; -@turing_computing_1950; @turing_computing_1950] blabla
blabla [-@turing_computing_1950;@turing_computing_1950;-@turing_computing_1950] blabla
blabla [@turing_computing_1950] blabla
blabla [-@turing_computing_1950] blabla
blabla [ @turing_computing_1950] blabla
blabla @turing_computing_1950 blabla
