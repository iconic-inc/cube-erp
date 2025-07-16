import { ActionFunctionArgs, LoaderFunctionArgs, data } from '@remix-run/node';
import { useLoaderData, useNavigate, useFetcher } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Pen,
  Coins,
  FileText,
  Tag,
  Folder,
  Info,
  CreditCard,
  Clock,
  CalendarCheck,
  CalendarX,
  Calendar,
  CalendarDays,
  PlusCircle,
  Wallet,
  Edit,
} from 'lucide-react';

import { isAuthenticated } from '~/services/auth.server';
import {
  getRewardById,
  deductToReward,
  updateReward,
} from '~/services/reward.server';
import { getEmployees } from '~/services/employee.server';
import { parseAuthCookie } from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { formatCurrency, formatDate } from '~/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { REWARD } from '~/constants/reward.constant';
import TextAreaInput from '~/components/TextAreaInput';
import TextInput from '~/components/TextInput';
import NumericInput from '~/components/NumericInput';
import TextRenderer from '~/components/TextRenderer';
import { canAccessRewardManagement } from '~/utils/permission';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const session = await parseAuthCookie(request);

  if (!canAccessRewardManagement(session?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  if (!session) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const rewardId = params.rewardId;
  if (!rewardId) {
    throw new Response(' ID is required', { status: 400 });
  }

  const [reward, employees] = await Promise.all([
    getRewardById(rewardId, session).catch((error) => {
      console.error('Error fetching reward :', error);
      throw new Response('Reward  not found', { status: 404 });
    }),
    getEmployees(new URLSearchParams([['limit', '1000']]), session).catch(
      (error) => {
        console.error('Error fetching employees:', error);
        return {
          data: [],
          pagination: { total: 0, page: 1, limit: 1000, totalPages: 0 },
        };
      },
    ),
  ]);

  return {
    reward,
    employees: employees.data,
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);
  if (!session) {
    return data(
      {
        success: false,
        toast: {
          type: 'error' as const,
          message: 'Bạn cần đăng nhập để thực hiện hành động này',
        },
      },
      { headers },
    );
  }

  const rewardId = params.rewardId;
  if (!rewardId) {
    return data(
      {
        success: false,
        toast: {
          type: 'error' as const,
          message: 'ID quỹ thưởng không hợp lệ',
        },
      },
      { headers },
    );
  }

  try {
    const formData = await request.formData();
    const actionType = formData.get('actionType') as string;

    if (actionType === 'deduct') {
      const amount = parseFloat(formData.get('amount') as string);
      const description = formData.get('description') as string;

      if (!amount || amount <= 0) {
        return data(
          {
            success: false,
            toast: {
              type: 'error' as const,
              message: 'Số tiền khấu trừ phải lớn hơn 0',
            },
          },
          { headers },
        );
      }

      await deductToReward({ amount, rewardId, description }, session);

      return data(
        {
          success: true,
          toast: {
            type: 'success' as const,
            message: `Đã khấu trừ ${formatCurrency(amount)} vào quỹ thưởng`,
          },
        },
        { headers },
      );
    } else if (actionType === 'cashout') {
      await updateReward(
        rewardId,
        { status: REWARD.STATUS.CLOSED.value },
        session,
      );

      return data(
        {
          success: true,
          toast: {
            type: 'success' as const,
            message: 'Đã chi tiền quỹ thưởng thành công',
          },
        },
        { headers },
      );
    }

    return data(
      {
        success: false,
        toast: {
          type: 'error' as const,
          message: 'Hành động không được hỗ trợ',
        },
      },
      { headers },
    );
  } catch (error: any) {
    console.error('Error in reward  action:', error);
    return data(
      {
        success: false,
        toast: {
          type: 'error' as const,
          message: error.message || 'Đã xảy ra lỗi',
        },
      },
      { headers },
    );
  }
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

export default function RewardDetail() {
  const { reward, employees } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [showDeductModal, setShowDeductModal] = useState(false);
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [deductAmount, setDeductAmount] = useState('');
  const [deductDescription, setDeductDescription] = useState('');

  const handleDeductSubmit = () => {
    if (!deductAmount || parseFloat(deductAmount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    const formData = new FormData();
    formData.append('actionType', 'deduct');
    formData.append('amount', deductAmount);
    formData.append('description', deductDescription);

    fetcher.submit(formData, { method: 'POST' });
    setShowDeductModal(false);
    setDeductAmount('');
    setDeductDescription('');
  };

  const handleCashOutSubmit = () => {
    const formData = new FormData();
    formData.append('actionType', 'cashout');

    fetcher.submit(formData, { method: 'POST' });
    setShowCashOutModal(false);
  };

  useEffect(() => {
    if (
      fetcher.data &&
      typeof fetcher.data === 'object' &&
      'success' in fetcher.data
    ) {
      const data = fetcher.data as any;
      if (data.success) {
        toast.success(data.toast.message);
        // Refresh the page data
        window.location.reload();
      } else {
        toast.error(data.toast.message);
      }
    }
  }, [fetcher.data]);

  return (
    <div className='space-y-4 sm:space-y-6 min-h-screen'>
      <ContentHeader
        title='Chi tiết Quỹ Thưởng'
        backHandler={() => navigate('/erp/rewards')}
        actionContent={
          <>
            <Edit className='h-4 w-4' />
            <span className='hidden sm:inline'>Chỉnh sửa Quỹ thưởng</span>
            <span className='sm:hidden'>Sửa</span>
          </>
        }
        actionHandler={() => {
          navigate(`./edit`);
        }}
      />

      {/* Reward Details Card */}
      <Card className='rounded-lg sm:rounded-xl overflow-hidden shadow-md sm:shadow-lg border border-gray-200'>
        <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 px-4 sm:px-6 rounded-t-lg sm:rounded-t-xl'>
          <div className='flex items-center space-x-3 sm:space-x-4'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center'>
              <Coins className='h-6 w-6 sm:h-8 sm:w-8' />
            </div>
            <div className='flex-1 min-w-0'>
              <CardTitle className='text-white text-lg sm:text-2xl lg:text-3xl font-bold break-words'>
                {reward.rw_name}
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
          {/* Basic Information */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
            <div className='space-y-3 sm:space-y-4'>
              <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
                <span className='text-base sm:text-lg'>Thông tin cơ bản</span>
              </h3>

              <div className='space-y-2 sm:space-y-3'>
                <div className='flex items-center space-x-2 sm:space-x-3'>
                  <Tag className='h-4 w-4 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0' />
                  <span className='text-sm sm:text-sm text-gray-500 flex-shrink-0'>
                    Tên quỹ:
                  </span>
                  <span className='text-sm sm:text-sm font-medium break-words min-w-0'>
                    {reward.rw_name}
                  </span>
                </div>

                <div className='flex items-center space-x-2 sm:space-x-3'>
                  <Info className='h-4 w-4 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0' />
                  <span className='text-sm sm:text-sm text-gray-500 flex-shrink-0'>
                    Trạng thái:
                  </span>
                  <Badge className={getStatusBadgeClass(reward.rw_status)}>
                    <span className='text-sm'>
                      {getStatusLabel(reward.rw_status)}
                    </span>
                  </Badge>
                </div>

                <div className='flex items-center space-x-2 sm:space-x-3'>
                  <CreditCard className='h-4 w-4 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0' />
                  <span className='text-sm sm:text-sm text-gray-500 flex-shrink-0'>
                    Tổng tiền:
                  </span>
                  <span className='text-sm sm:text-sm font-bold text-blue-600 break-all min-w-0'>
                    {formatCurrency(reward.rw_currentAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Information */}
            <div className='space-y-3 sm:space-y-4'>
              <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
                <span className='text-base sm:text-lg'>
                  Thông tin thời gian
                </span>
              </h3>

              <div className='space-y-2 sm:space-y-3'>
                <div className='flex items-center space-x-2 sm:space-x-3'>
                  <CalendarCheck className='h-4 w-4 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0' />
                  <span className='text-sm sm:text-sm text-gray-500 flex-shrink-0'>
                    Ngày bắt đầu:
                  </span>
                  <span className='text-sm sm:text-sm font-medium break-words min-w-0'>
                    {formatDate(reward.rw_startDate)}
                  </span>
                </div>

                {reward.rw_endDate && (
                  <div className='flex items-center space-x-2 sm:space-x-3'>
                    <CalendarX className='h-4 w-4 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0' />
                    <span className='text-sm sm:text-sm text-gray-500 flex-shrink-0'>
                      Ngày kết thúc:
                    </span>
                    <span className='text-sm sm:text-sm font-medium break-words min-w-0'>
                      {formatDate(reward.rw_endDate)}
                    </span>
                  </div>
                )}
                {reward.rw_cashedOutAt && (
                  <div className='flex items-center space-x-2 sm:space-x-3'>
                    <Calendar className='h-4 w-4 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0' />
                    <span className='text-sm sm:text-sm text-gray-500 flex-shrink-0'>
                      Ngày đóng quỹ:
                    </span>
                    <span className='text-sm sm:text-sm font-medium break-words min-w-0'>
                      {formatDate(reward.rw_cashedOutAt)}
                    </span>
                  </div>
                )}

                <div className='flex items-center space-x-2 sm:space-x-3'>
                  <CalendarDays className='h-4 w-4 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0' />
                  <span className='text-sm sm:text-sm text-gray-500 flex-shrink-0'>
                    Ngày tạo:
                  </span>
                  <span className='text-sm sm:text-sm font-medium break-words min-w-0'>
                    {formatDate(reward.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {reward.rw_description && (
            <div className='space-y-2 sm:space-y-3'>
              <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
                <span className='text-base sm:text-lg'>Mô tả</span>
              </h3>
              <div className='bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200'>
                <div className='text-sm sm:text-sm'>
                  <TextRenderer content={reward.rw_description} />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {reward.rw_status === 'active' && (
            <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200'>
              <Button
                onClick={() => setShowDeductModal(true)}
                className='inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-sm font-medium rounded-md hover:bg-blue-700 w-full sm:w-auto'
              >
                <PlusCircle className='h-4 w-4 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
                <span className='hidden sm:inline'>Khấu trừ doanh thu</span>
                <span className='sm:hidden'>Khấu trừ</span>
              </Button>

              <Button
                onClick={() => setShowCashOutModal(true)}
                className='inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 text-white text-sm sm:text-sm font-medium rounded-md hover:bg-green-700 w-full sm:w-auto'
                disabled={reward.rw_currentAmount <= 0}
              >
                <Wallet className='h-4 w-4 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
                <span className='hidden sm:inline'>Đóng quỹ thưởng</span>
                <span className='sm:hidden'>Đóng quỹ</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deduct Modal */}
      <Dialog open={showDeductModal} onOpenChange={setShowDeductModal}>
        <DialogContent className='w-[95vw] max-w-md mx-auto'>
          <DialogHeader>
            <DialogTitle className='text-lg sm:text-lg'>
              Khấu trừ doanh thu vào quỹ thưởng
            </DialogTitle>
            <DialogDescription className='text-sm sm:text-sm'>
              Nhập số tiền cần khấu trừ từ doanh thu để thêm vào quỹ thưởng
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3 sm:space-y-4'>
            <NumericInput
              label={
                <>
                  <span className='text-sm sm:text-sm'>Số tiền khấu trừ</span>{' '}
                  <span className='text-red-500'>*</span>
                </>
              }
              value={deductAmount}
              onValueChange={setDeductAmount}
              required
            />
            <TextAreaInput
              label='Mô tả (tùy chọn)'
              name='description'
              value={deductDescription}
              onChange={setDeductDescription}
              placeholder='Mô tả về lý do khấu trừ...'
              rows={3}
            />
          </div>
          <DialogFooter className='flex-col sm:flex-row gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={() => setShowDeductModal(false)}
              className='w-full sm:w-auto text-sm sm:text-sm'
            >
              Hủy
            </Button>
            <Button
              onClick={handleDeductSubmit}
              disabled={fetcher.state === 'submitting'}
              className='w-full sm:w-auto text-sm sm:text-sm'
            >
              {fetcher.state === 'submitting' ? 'Đang xử lý...' : 'Khấu trừ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cash Out Modal */}
      <Dialog open={showCashOutModal} onOpenChange={setShowCashOutModal}>
        <DialogContent className='w-[95vw] max-w-md mx-auto'>
          <DialogHeader>
            <DialogTitle className='text-lg sm:text-lg'>
              Đóng quỹ thưởng
            </DialogTitle>
            <DialogDescription className='text-sm sm:text-sm'>
              Đánh dấu quỹ thưởng đã đóng. Hành động này sẽ chuyển trạng thái
              quỹ thành "Đã đóng".
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className='flex-col sm:flex-row gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={() => setShowCashOutModal(false)}
              className='w-full sm:w-auto text-sm sm:text-sm'
            >
              Hủy
            </Button>
            <Button
              onClick={handleCashOutSubmit}
              disabled={fetcher.state === 'submitting'}
              className='w-full sm:w-auto text-sm sm:text-sm'
            >
              {fetcher.state === 'submitting'
                ? 'Đang xử lý...'
                : 'Đóng quỹ thưởng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
