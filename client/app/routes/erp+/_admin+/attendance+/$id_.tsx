import { ActionFunctionArgs, data } from '@remix-run/node';
import {
  deleteAttendance,
  updateAttendance,
} from '~/services/attendance.server';
import { isAuthenticated } from '~/services/auth.server';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { id } = params;
  const formData = await request.formData();
  const updateData = Object.fromEntries(formData);

  try {
    const { session, headers } = await isAuthenticated(request);
    if (!session) {
      throw new Error('User not authenticated');
    }
    if (!id) {
      throw new Error('ID not found');
    }

    switch (request.method) {
      case 'PUT': {
        await updateAttendance(
          id,
          {
            checkInTime: new Date(
              `${updateData.checkInDate} ${updateData.checkInTime} GMT+07:00`,
            ).toISOString(), // convert checkInTime to ISO format in GMT+00:00
            checkOutTime: updateData.checkOutTime
              ? new Date(
                  `${updateData.checkInDate} ${updateData.checkOutTime} GMT+07:00`,
                ).toISOString() // convert checkOutTime to ISO format in GMT+00:00
              : '',
            date: new Date(
              `${updateData.checkInDate} 00:00:00 GMT+07:00`,
            ).toISOString(), // convert checkInDate to ISO format in GMT+00:00
          },
          session,
        );
        return data(
          {
            toast: { message: 'Cập nhật thành công', type: 'success' },
          },
          { headers },
        );
      }

      case 'DELETE': {
        // Handle delete action
        await deleteAttendance(id, session);
        return data(
          {
            toast: { message: 'Xóa thành công', type: 'success' },
          },
          { headers },
        );
      }

      default: {
        return {
          toast: { message: 'Không hỗ trợ phương thức này', type: 'error' },
        };
      }
    }
  } catch (error: any) {
    console.error(error);
    return {
      toast: { message: error.message || error.statusText, type: 'error' },
    };
  }
};
