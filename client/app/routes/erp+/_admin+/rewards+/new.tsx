import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  data as dataResponse,
} from '@remix-run/node';
import { Link, useLocation, useLoaderData } from '@remix-run/react';
import { useMemo } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'react-toastify';

import { isAuthenticated } from '~/services/auth.server';
import { createReward } from '~/services/reward.server';
import ContentHeader from '~/components/ContentHeader';
import { IRewardCreate } from '~/interfaces/reward.interface';
import RewardDetailForm from './_components/RewardDetailForm';
import { generateFormId } from '~/utils';
import { REWARD } from '~/constants/reward.constant';
import { parseAuthCookie } from '~/services/cookie.server';
import { canAccessRewardManagement } from '~/utils/permission';

// Định nghĩa kiểu cho toast
type ToastType = 'success' | 'error' | 'info' | 'warning';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (!canAccessRewardManagement(user?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  await isAuthenticated(request);
  return {};
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  switch (request.method) {
    case 'POST': {
      try {
        const formData = await request.formData();

        // Tạo dữ liệu từ form
        const data: IRewardCreate = {
          name: formData.get('name') as string,
          description: (formData.get('description') as string) || undefined,
          currentAmount: Number(formData.get('currentAmount')) || 0,
          eventType: REWARD.EVENT_TYPE.OTHER.value,
          startDate: formData.get('startDate') as string,
          endDate: (formData.get('endDate') as string) || undefined,
        };

        // Kiểm tra dữ liệu bắt buộc
        if (!data.name || !data.currentAmount || !data.startDate) {
          return dataResponse(
            {
              reward: null,
              toast: {
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
                type: 'error' as ToastType,
              },
              redirectTo: null,
            },
            { headers, status: 400 },
          );
        }

        if (data.currentAmount <= 0) {
          return dataResponse(
            {
              reward: null,
              toast: {
                message: 'Số tiền phải lớn hơn 0',
                type: 'error' as ToastType,
              },
              redirectTo: null,
            },
            { headers, status: 400 },
          );
        }

        const rewardData: IRewardCreate = {
          name: data.name,
          description: data.description,
          currentAmount: data.currentAmount,
          eventType: data.eventType as any,
          startDate: new Date(data.startDate).toISOString(),
          endDate: data.endDate
            ? new Date(data.endDate).toISOString()
            : undefined,
        };

        const res = await createReward(rewardData, session!);

        return dataResponse(
          {
            reward: res,
            toast: {
              message: 'Thêm mới quỹ thưởng thành công!',
              type: 'success' as ToastType,
            },
            redirectTo: `/erp/rewards/${res.id}`,
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error creating reward:', error);

        let errorMessage = 'Có lỗi xảy ra khi thêm quỹ thưởng';

        return dataResponse(
          {
            reward: null,
            toast: {
              message: errorMessage,
              type: 'error' as ToastType,
            },
            redirectTo: null,
          },
          { headers, status: 500 },
        );
      }
    }

    default:
      return dataResponse(
        {
          reward: null,
          toast: { message: 'Method not allowed', type: 'error' as ToastType },
          redirectTo: null,
        },
        { headers, status: 405 },
      );
  }
};

export default function NewReward() {
  const location = useLocation();
  const actionData = location.state?.actionData;

  // Hiển thị thông báo nếu có
  if (actionData?.toast) {
    const toastType = actionData.toast.type as ToastType;
    toast[toastType](actionData.toast.message);
  }

  const formId = useMemo(() => generateFormId('reward-detail-form'), []);

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Tạo quỹ thưởng mới'
        actionContent={
          <>
            <Save className='h-4 w-4' />
            <span className='hidden sm:inline'>Lưu quỹ thưởng</span>
            <span className='sm:hidden'>Lưu</span>
          </>
        }
        actionHandler={() => {
          const form = document.getElementById(formId) as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }}
      />

      {/* Form Container */}
      <RewardDetailForm formId={formId} type='create' />
    </div>
  );
}
