import { ActionFunctionArgs, data } from '@remix-run/node';
import { getClientIPAddress } from 'remix-utils/get-client-ip-address';
import { authenticator, isAuthenticated } from '~/services/auth.server';
import {
  createOfficeIP,
  deleteOfficeIP,
  updateOfficeIP,
} from '~/services/officeIP.server';
export const action = async ({ params, request }: ActionFunctionArgs) => {
  const id = params.id || '';
  const formData = await request.formData();
  let ipAddress = formData.get('ipAddress') as string;
  const officeName = formData.get('officeName') as string;

  const { session, headers } = await isAuthenticated(request);
  try {
    switch (request.method) {
      case 'PUT': {
        if (!ipAddress) {
          ipAddress = getClientIPAddress(request)!;
          if (!ipAddress) {
            return data(
              {
                toast: {
                  message: 'Không thể lấy địa chỉ IP',
                  type: 'error',
                },
              },
              { headers },
            );
          }
        }
        const officeIP = await updateOfficeIP(
          id,
          { officeName, ipAddress },
          session!,
        );

        return data(
          {
            toast: {
              message: 'Cập nhật địa chỉ IP thành công',
              type: 'success',
            },
          },
          { headers },
        );
      }

      case 'DELETE': {
        const officeIP = await deleteOfficeIP(id, session!);
        return data(
          {
            toast: {
              message: 'Xóa địa chỉ IP thành công',
              type: 'success',
            },
          },
          { headers },
        );
      }

      default: {
        return data(
          {
            toast: {
              message: 'Không thể thực hiện yêu cầu',
              type: 'error',
            },
          },
          { headers },
        );
      }
    }
  } catch (error: any) {
    return data(
      {
        toast: {
          message: error.message || error.statusText,
          type: 'error',
        },
      },
      { headers },
    );
  }
};
