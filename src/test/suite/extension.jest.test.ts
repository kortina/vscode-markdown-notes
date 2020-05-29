import 'jest';
import { foo, NoteWorkspace } from '../../NoteWorkspace';
// import { foo } from '../../NoteWorkspace';

test('foo', () => {
  expect(foo()).toBe(1);
});

test('rxWikiLink', () => {
  let rx = NoteWorkspace.rxWikiLink();
  expect(('Some [[wiki-link]].'.match(rx) || [])[0]).toEqual('[[wiki-link]]');
  expect(('Some [[wiki link]].'.match(rx) || [])[0]).toEqual('[[wiki link]]');
  expect(('Some [[wiki-link.md]].'.match(rx) || [])[0]).toEqual('[[wiki-link.md]]');
  expect('Some [[wiki-link.md].').not.toMatch(rx);
});
