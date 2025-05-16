import { ActionFunctionArgs } from '@remix-run/node';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import { updateBooking } from '~/services/booking.server';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const user = await isAuthenticated(request);

  switch (request.method) {
    case 'POST': {
      const id = params.id || '';

      const res = await updateBooking(id, { viewed: false }, user!);
      return new Response(null, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    default: {
      return new Response(null, {
        status: 405,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  }
};
