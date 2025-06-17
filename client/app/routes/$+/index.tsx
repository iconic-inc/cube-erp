import { redirect } from '@remix-run/node';
import HandsomeError from '~/components/HandsomeError';

export const loader = () => {
  // throw new Response(null, {
  //   status: 404,
  //   statusText: 'Not Found',
  // });
  throw redirect('/erp');
};

export default function PageNotFound() {
  return <HandsomeError basePath='/' />;
}
