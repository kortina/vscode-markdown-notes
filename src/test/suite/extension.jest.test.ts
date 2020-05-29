// import { foo, NoteWorkspace } from '../../NoteWorkspace';
import { foo } from '../../NoteWorkspace';

test('foo', () => {
  expect(foo()).toBe(1);
});

// test('rxWikiLink', () => {
//   let rx = NoteWorkspace.rxWikiLink();
//   expect('Some [[wiki-link]].').toMatch(rx);
//   expect('Some [[wiki link]].').toMatch(rx);
//   expect('Some [[wiki-link.md]].').toMatch(rx);
// });