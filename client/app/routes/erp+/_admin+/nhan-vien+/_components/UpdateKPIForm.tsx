import { useFetcher, useNavigate } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Defer from '~/components/Defer';
import { IKPIInstance } from '~/interfaces/kpi.interface';
import { action } from '../kpi+/$instanceId.edit';

export default function UpdateKPIForm({
  kpiInstance,
}: {
  kpiInstance?: Promise<IKPIInstance | null>;
}) {
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<number>(0);

  useEffect(() => {
    if (kpiInstance) {
      kpiInstance
        .then((instance) => {
          if (instance) {
            setCompleted(instance.completed);
          }
        })
        .catch((error) => {
          console.error('Error fetching KPI instance:', error);
        });
    }
  }, []);

  const toastIdRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        toastIdRef.current = toast.loading('Đang cập nhật KPI...', {
          autoClose: false,
        });
        setLoading(true);
        break;

      case 'loading':
        if (fetcher.data?.toast && toastIdRef.current) {
          const { toast: toastData } = fetcher.data as any;
          toast.update(toastIdRef.current, {
            render: toastData.message,
            type: toastData.type || 'success', // Default to 'success' if type is not provided
            autoClose: 3000,
            isLoading: false,
          });
          toastIdRef.current = null;
          setLoading(false);

          break;
        }

        break;
    }
  }, [fetcher.state]);

  return (
    <Defer
      resolve={kpiInstance}
      fallback={
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='flex flex-col items-center justify-center py-10'>
            <span className='material-symbols-outlined text-4xl text-gray-400 mb-2'>
              hourglass_empty
            </span>
            <p className='text-gray-600'>Đang tải dữ liệu...</p>
          </div>
        </div>
      }
    >
      {(instance) => {
        if (!instance) {
          return (
            <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
              <div className='flex flex-col items-center justify-center py-10'>
                <span className='material-symbols-outlined text-4xl text-gray-400 mb-2'>
                  error
                </span>
                <p className='text-gray-600'>Không tìm thấy KPI</p>
              </div>
            </div>
          );
        }

        const progress = Math.round((completed / instance.goal) * 100);
        return (
          <fetcher.Form method='PUT'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* KPI Information */}
              <div className='space-y-5'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Tên KPI
                  </label>
                  <div className='w-full py-2 px-3 border border-gray-200 rounded-md text-sm bg-gray-50'>
                    {instance.kpi.name}
                  </div>
                </div>

                <div>
                  <span className='block text-sm font-medium text-gray-700 mb-2'>
                    Mô tả
                  </span>
                  <div className='w-full p-3 border border-gray-200 rounded-md text-sm bg-gray-50 min-h-[80px]'>
                    {instance.kpi.description}
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <span className='block text-sm font-medium text-gray-700 mb-2'>
                      Loại chu kỳ
                    </span>
                    <div className='w-full p-3 border border-gray-200 rounded-md text-sm bg-gray-50'>
                      {(() => {
                        switch (instance.kpi.intervalType) {
                          case 'daily':
                            return 'Hàng ngày';
                          case 'weekly':
                            return 'Hàng tuần';
                          case 'monthly':
                            return 'Hàng tháng';
                          case 'quarterly':
                            return 'Hàng quý';
                          case 'yearly':
                            return 'Hàng năm';
                          default:
                            return 'Không xác định';
                        }
                      })()}
                    </div>
                  </div>

                  <div>
                    <span className='block text-sm font-medium text-gray-700 mb-2'>
                      Trạng thái
                    </span>
                    <div
                      className={`w-full p-3 border rounded-md text-sm ${
                        progress >= 100
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : progress >= 70
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : progress >= 30
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                      }`}
                    >
                      {progress >= 100
                        ? 'Hoàn thành'
                        : progress >= 70
                          ? 'Đang tiến triển tốt'
                          : progress >= 30
                            ? 'Cần cải thiện'
                            : 'Mới bắt đầu'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Update Progress */}
              <div className='space-y-5'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Tiến độ hiện tại
                  </label>

                  {/* Progress bar */}
                  <div className='mb-3'>
                    <div className='h-4 w-full bg-gray-200 rounded-full overflow-hidden'>
                      <div
                        className={`h-full ${
                          progress >= 100
                            ? 'bg-green-500'
                            : progress >= 70
                              ? 'bg-blue-500'
                              : progress >= 30
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <div className='flex justify-between mt-1'>
                      <span className='text-xs text-gray-500'>0</span>
                      <span className='text-xs font-medium'>{progress}%</span>
                      <span className='text-xs text-gray-500'>100%</span>
                    </div>
                  </div>

                  <div className='flex items-center'>
                    <input
                      type='number'
                      name='completed'
                      min='0'
                      value={completed}
                      onChange={(e) =>
                        setCompleted(parseInt(e.target.value) || 0)
                      }
                      className='w-full py-2 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
                    />
                    <span className='ml-3 min-w-[50px] text-center text-sm font-medium bg-red-100 text-red-800 px-2 py-0.5 rounded'>
                      {completed}/{instance.goal}
                    </span>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Mục tiêu
                  </label>
                  <div className='w-full py-2 px-3 border border-gray-200 rounded-md text-sm bg-gray-50'>
                    {instance.goal}
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Thời gian
                  </label>
                  <div className='flex flex-col space-y-2'>
                    <div className='flex items-center'>
                      <span className='text-sm text-gray-500 w-20'>
                        Bắt đầu:
                      </span>
                      <div className='w-full py-1 px-3 border border-gray-200 rounded-md text-sm bg-gray-50'>
                        {instance?.startDate
                          ? new Date(instance.startDate).toLocaleDateString(
                              'vi-VN',
                            )
                          : 'N/A'}
                      </div>
                    </div>
                    <div className='flex items-center'>
                      <span className='text-sm text-gray-500 w-20'>
                        Kết thúc:
                      </span>
                      <div className='w-full py-1 px-3 border border-gray-200 rounded-md text-sm bg-gray-50'>
                        {instance?.endDate
                          ? new Date(instance.endDate).toLocaleDateString(
                              'vi-VN',
                            )
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='mt-8 flex justify-end space-x-3'>
              <button
                type='button'
                onClick={() => navigate('/hrm/nhan-vien/kpi')}
                className='px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-300 transform hover:-translate-y-0.5 shadow hover:shadow-md'
              >
                Hủy bỏ
              </button>
              <button
                type='submit'
                disabled={loading}
                className='px-4 py-2 bg-red-500 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 transform hover:-translate-y-0.5 shadow hover:shadow-md flex items-center'
              >
                <span className='material-symbols-outlined mr-1 text-sm'>
                  save
                </span>
                Cập nhật KPI
              </button>
            </div>
          </fetcher.Form>
        );
      }}
    </Defer>
  );
}
