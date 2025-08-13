import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData, useNavigate } from '@remix-run/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';

import { getRewards, deleteReward } from '~/services/reward.server';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { IActionFunctionReturn, IListColumn } from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';
import List from '~/components/List';
import { Badge } from '~/components/ui/badge';
import { formatDate, formatCurrency } from '~/utils';
import { IReward } from '~/interfaces/reward.interface';
import { REWARD } from '~/constants/reward.constant';
import { canAccessRewardManagement } from '~/utils/permission';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (!canAccessRewardManagement(user?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const url = new URL(request.url);

  const rewardsPromise = getRewards(url.searchParams, user!).catch((error) => {
    console.error('Error fetching reward s:', error);
    return {
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  });

  return {
    rewards: rewardsPromise,
  };
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-gray-100 text-gray-800';
    case 'cashed_out':
      return 'bg-purple-100 text-purple-800 font-medium';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Đang hoạt động';
    case 'closed':
      return 'Đã đóng';
    case 'cashed_out':
      return 'Đã chi tiền';
    default:
      return status;
  }
};

export default function RewardsIndex() {
  const { rewards } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [visibleColumns, setVisibleColumns] = useState<IListColumn<IReward>[]>([
    {
      key: 'rw_name',
      title: 'Tên quỹ thưởng',
      visible: true,
      sortField: 'rw_name',
      render: (item) => (
        <Link
          to={`/erp/rewards/${item.id}`}
          className='text-blue-600 hover:underline block w-full h-full font-medium'
        >
          {item.rw_name}
        </Link>
      ),
    },
    {
      key: 'rw_currentAmount',
      title: 'Tổng tiền',
      visible: true,
      sortField: 'rw_currentAmount',
      render: (item) => (
        <div className='font-mono'>{formatCurrency(item.rw_currentAmount)}</div>
      ),
    },
    {
      key: 'rw_status',
      title: 'Trạng thái',
      visible: true,
      sortField: 'rw_status',
      filterField: 'status',
      options: Object.values(REWARD.STATUS),
      render: (item) => (
        <Badge className={getStatusBadgeClass(item.rw_status)}>
          {getStatusLabel(item.rw_status)}
        </Badge>
      ),
    },
    {
      key: 'rw_startDate',
      title: 'Ngày bắt đầu',
      visible: true,
      sortField: 'rw_startDate',
      render: (item) => (
        <div className='text-sm text-gray-600'>
          {formatDate(item.rw_startDate)}
        </div>
      ),
    },
    {
      key: 'cashOutInfo',
      title: 'Ngày đóng',
      visible: true,
      render: (item) => {
        if (
          item.rw_status === REWARD.STATUS.CLOSED.value &&
          item.rw_cashedOutAt
        ) {
          return (
            <div className='text-sm'>{formatDate(item.rw_cashedOutAt)}</div>
          );
        }
        return <div className='text-gray-500 italic'>N/A</div>;
      },
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      visible: false,
      sortField: 'createdAt',
      render: (item) => (
        <div className='text-sm text-gray-600'>
          {formatDate(item.createdAt)}
        </div>
      ),
    },
  ]);

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      <ContentHeader
        title='Quản lý quỹ thưởng'
        actionContent={
          <>
            <Plus className='w-4 h-4' />
            <span className='hidden sm:inline'>Tạo quỹ thưởng mới</span>
            <span className='sm:hidden'>Tạo mới</span>
          </>
        }
        actionHandler={() => navigate('/erp/rewards/new')}
      />

      <List<IReward>
        itemsPromise={rewards}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        addNewHandler={() => navigate('/erp/rewards/new')}
        exportable={false}
        name='Quỹ thưởng'
        deleteHandleRoute='/erp/rewards'
      />
    </div>
  );
}

export const action = async ({
  request,
}: ActionFunctionArgs): IActionFunctionReturn<any> => {
  const { session, headers } = await isAuthenticated(request);
  if (!session) {
    return data(
      {
        success: false,
        toast: {
          type: 'error',
          message: 'Bạn cần đăng nhập để thực hiện hành động này',
        },
      },
      { headers },
    );
  }

  try {
    const formData = await request.formData();
    switch (request.method) {
      case 'DELETE':
        const IdsString = formData.get('itemIds') as string;
        if (!IdsString) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có quỹ thưởng nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }

        const Ids = JSON.parse(IdsString);

        // Delete s one by one (API doesn't support bulk delete)
        for (const Id of Ids) {
          try {
            await deleteReward(Id, session);
          } catch (error: any) {
            console.error(`Error deleting  ${Id}:`, error);
            // Continue with other s even if one fails
          }
        }

        return data(
          {
            success: true,
            toast: {
              message: `Đã xóa ${Ids.length} quỹ thưởng`,
              type: 'success',
            },
          },
          { headers },
        );

      default:
        return data(
          {
            success: false,
            toast: {
              message: 'Phương thức không được hỗ trợ',
              type: 'error',
            },
          },
          { headers },
        );
    }
  } catch (error: any) {
    console.error('Error in reward s action:', error);
    return data(
      {
        success: false,
        toast: {
          message: error.message || 'Đã xảy ra lỗi',
          type: 'error',
        },
      },
      { headers },
    );
  }
};
