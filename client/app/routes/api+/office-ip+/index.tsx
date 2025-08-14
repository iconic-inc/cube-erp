import { ActionFunctionArgs, data } from '@remix-run/node';
import { getClientIPAddress } from 'remix-utils/get-client-ip-address';
import { IActionFunctionReturn } from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';
import { createOfficeIP } from '~/services/officeIP.server';

export const action = async ({
  request,
}: ActionFunctionArgs): IActionFunctionReturn => {
  const formData = await request.formData();
  let ipAddress = getClientIPAddress(request);
  if (request.headers.get('host')?.includes('localhost')) {
    // For local development, use a fixed IP address
    ipAddress = '127.0.0.1';
  }

  const officeName = formData.get('officeName') as string;

  if (!ipAddress) {
    return data({
      success: false,
      toast: {
        message: 'Không thể lấy địa chỉ IP',
        type: 'error',
      },
    });
  }

  const { session, headers } = await isAuthenticated(request);
  try {
    switch (request.method) {
      case 'POST': {
        const officeIP = await createOfficeIP(
          { officeName, ipAddress },
          session!,
        );

        return data(
          {
            success: true,
            toast: {
              message: 'Thêm địa chỉ IP thành công',
              type: 'success',
            },
          },
          { headers },
        );
      }

      default: {
        return data(
          {
            success: false,
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
        success: false,
        toast: {
          message: error.message || error.statusText,
          type: 'error',
        },
      },
      { headers },
    );
  }
};
