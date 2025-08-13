import Hydrated from '../Hydrated';
import TextEditorClient from './index.client';

export default function TextEditor(
  props: Parameters<typeof TextEditorClient>[0],
) {
  return <Hydrated>{() => <TextEditorClient {...props} />}</Hydrated>;
}
