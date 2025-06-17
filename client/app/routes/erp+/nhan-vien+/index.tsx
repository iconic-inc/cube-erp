import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import DashContentHeader from '~/components/DashContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const user = await parseAuthCookie(request);

    return {};
  } catch (error) {
    console.error(error);

    return {};
  }
};

export default function IndexHRM() {
  const {} = useLoaderData<typeof loader>();

  const navigate = useNavigate();

  return (
    <>
      {/* Content Header */}
      <DashContentHeader title='Trang chủ' />

      {/* Main Dashboard Content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'></div>
    </>
  );
}
