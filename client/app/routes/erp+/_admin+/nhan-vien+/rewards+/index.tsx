import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData, useNavigate } from '@remix-run/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';

import { listRewardsForEmployee, deleteReward } from '~/services/reward.server';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { IActionFunctionReturn, IListColumn } from '~/interfaces/app.interface';
import { Badge } from '~/components/ui/badge';
import { formatDate, formatCurrency } from '~/utils';
import { IReward } from '~/interfaces/reward.interface';
import { REWARD } from '~/constants/reward.constant';
import { canAccessRewardManagement } from '~/utils/permission';
import List from '~/components/List';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (!canAccessRewardManagement(user?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const url = new URL(request.url);
  const rewardsPromise = listRewardsForEmployee(url.searchParams, user!).catch(
    (error) => {
      console.error('Error fetching reward s:', error);
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    },
  );

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
      render: (item) => <span>{item.rw_name}</span>,
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
      <ContentHeader title='Quản lý quỹ thưởng' />

      <List<IReward>
        itemsPromise={rewards}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        addNewHandler={() => navigate('/erp/rewards/new')}
        exportable={false}
        name='Quỹ thưởng'
      />
    </div>
  );
}

export const action = async ({
  request,
}: ActionFunctionArgs): IActionFunctionReturn<any> => {
  return data({
    success: false,
    toast: {
      message: 'Bạn không có quyền thực hiện hành động này',
      type: 'error',
    },
  });
};
