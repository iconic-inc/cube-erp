import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  data as dataResponse,
} from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useMemo } from 'react';

import RewardDetailForm from './_components/RewardDetailForm';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { getRewardById, updateReward } from '~/services/reward.server';
import { isAuthenticated } from '~/services/auth.server';
import { IRewardUpdate } from '~/interfaces/reward.interface';
import { generateFormId } from '~/utils';
import { canAccessRewardManagement } from '~/utils/permission';
import { Save } from 'lucide-react';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const auth = await parseAuthCookie(request);

  if (!canAccessRewardManagement(auth?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const rewardId = params.rewardId as string;
  if (!rewardId) {
    throw new Response('Không tìm thấy quỹ thưởng', { status: 404 });
  }

  const rewardPromise = getRewardById(rewardId, auth!).catch((e) => {
    console.error('Error fetching reward:', e);
    return {
      success: false,
      message: 'Xảy ra lỗi khi lấy thông tin quỹ thưởng',
    };
  });

  // Trả về dữ liệu cần thiết cho trang RewardEdit
  return {
    rewardPromise,
  };
};

export default function RewardEdit() {
  const { rewardPromise } = useLoaderData<typeof loader>();
  const formId = useMemo(() => generateFormId('reward-update-form'), []);

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Chỉnh sửa Quỹ thưởng'
        actionContent={
          <>
            <Save className='h-4 w-4' />
            <span className='hidden sm:inline'>Cập nhật quỹ thưởng</span>
            <span className='sm:hidden'>Cập nhật</span>
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
      <RewardDetailForm
        formId={formId}
        type='update'
        rewardPromise={rewardPromise as any}
      />
    </div>
  );
}

type ToastType = 'success' | 'error' | 'info' | 'warning';

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  const rewardId = params.rewardId as string;
  if (!rewardId) {
    return dataResponse(
      {
        reward: null,
        toast: {
          message: 'Không tìm thấy quỹ thưởng',
          type: 'error' as ToastType,
        },
        redirectTo: null,
      },
      { headers, status: 404 },
    );
  }

  switch (request.method) {
    case 'PUT': {
      try {
        const formData = await request.formData();
        const data: IRewardUpdate = {
          name: formData.get('name') as string,
          description: (formData.get('description') as string) || undefined,
          currentAmount: Number(formData.get('currentAmount')) || 0,
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

        const updateData: IRewardUpdate = {
          name: data.name,
          description: data.description,
          currentAmount: data.currentAmount,
          startDate: new Date(data.startDate).toISOString(),
          endDate: data.endDate
            ? new Date(data.endDate).toISOString()
            : undefined,
        };

        const res = await updateReward(rewardId, updateData, session!);

        return dataResponse(
          {
            reward: res,
            toast: {
              message: 'Cập nhật quỹ thưởng thành công!',
              type: 'success' as ToastType,
            },
            redirectTo: `/erp/rewards/${res.id}`,
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error updating reward:', error);

        let errorMessage = 'Có lỗi xảy ra khi cập nhật quỹ thưởng';

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
