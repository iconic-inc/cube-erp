import { Link, useFetcher } from '@remix-run/react';

import { IKPI, IKPIInstance } from '~/interfaces/kpi.interface';
import Defer from '@components/Defer';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { action } from '../kpi+/$instanceId.edit';

export default function KPIInstanceList({
  kpiInstances,
  status,
}: {
  kpiInstances: Promise<IKPIInstance[]>;
  status?: string;
}) {
  const fetcher = useFetcher<typeof action>();

  const [loading, setLoading] = useState(false);
  const toastIdRef = useRef<any>(null);

  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        toastIdRef.current = toast.loading('Đang xoá...', {
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
    <div className='bg-white rounded-lg shadow-sm p-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6'>
        <h3 className='text-lg font-semibold'>Danh sách KPI</h3>
        <div className='flex space-x-2 mt-2 sm:mt-0'>
          <button className='px-3 py-1 text-xs border border-gray-200 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200'>
            Tuần
          </button>
          <button className='px-3 py-1 text-xs border border-transparent rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors duration-200'>
            Tháng
          </button>
          <button className='px-3 py-1 text-xs border border-gray-200 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200'>
            Quý
          </button>
        </div>
      </div>

      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='font-normal text-gray-700 bg-gray-50'>
            <tr className='text-center'>
              <th className='px-6 py-3 text-left'>Tên KPI</th>
              <th>Ngày bắt đầu</th>
              <th>Ngày kết thúc</th>
              <th>Tiến độ</th>
              <th>Chu kỳ</th>
              <th>Cập nhật</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            <Defer
              resolve={kpiInstances}
              fallback={
                <tr>
                  <td
                    colSpan={7}
                    className='px-6 py-4 text-center text-gray-500'
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              }
            >
              {(data) => {
                if (!data.length) {
                  return (
                    <tr>
                      <td
                        colSpan={7}
                        className='px-6 py-4 text-center text-gray-500'
                      >
                        Không có dữ liệu KPI
                      </td>
                    </tr>
                  );
                }

                // Filter kpiInstanceson status
                const filteredKPIs = data.filter((instance) => {
                  if (!status) return true; // Show all if no status filter
                  return status === 'active'
                    ? instance.kpi.isActive
                    : !instance.kpi.isActive;
                });

                if (filteredKPIs.length === 0) {
                  return (
                    <tr>
                      <td
                        colSpan={7}
                        className='px-6 py-4 text-center text-gray-500'
                      >
                        {status
                          ? `Không tìm thấy KPI ${status === 'active' ? 'đang hoạt động' : 'không hoạt động'}`
                          : 'Không tìm thấy KPI nào'}
                      </td>
                    </tr>
                  );
                }

                return (
                  <>
                    {filteredKPIs.map(({ kpi, ...instance }) => (
                      <tr
                        key={kpi.id}
                        className='hover:bg-gray-50 transition-colors duration-200 text-center'
                      >
                        <td className='px-6 text-start'>
                          <div className='text-sm font-medium text-gray-900'>
                            {kpi.name}
                          </div>
                          <div className='text-xs text-gray-500 truncate'>
                            {kpi.description}
                          </div>
                        </td>
                        <td>
                          <div className='text-sm'>
                            {new Date(instance.startDate).toLocaleDateString(
                              'vi-VN',
                            )}
                          </div>
                        </td>
                        <td>
                          <div className='text-sm'>
                            {new Date(instance.endDate).toLocaleDateString(
                              'vi-VN',
                            )}
                          </div>
                        </td>

                        <td className='flex items-center gap-2 px-6 py-4 whitespace-nowrap'>
                          <div className='flex-1'>
                            <div className='text-sm text-gray-900'>
                              {instance.completed} / {instance.goal}
                            </div>

                            <div className='w-full bg-gray-200 rounded-full h-2.5 mt-1'>
                              <div
                                className='bg-blue-500 h-2.5 rounded-full'
                                style={{
                                  width: `${(instance.completed / instance.goal) * 100}%`,
                                  maxWidth: '100%',
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className='text-sm text-gray-900'>
                            {(() => {
                              const progress =
                                (instance.completed / instance.goal) * 100;
                              return `${Math.round(progress)}%`;
                            })()}
                          </div>
                        </td>

                        <td>
                          <div className='text-sm text-gray-900'>
                            {(() => {
                              switch (kpi.intervalType) {
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
                        </td>

                        <td>
                          <div className='text-sm'>
                            {new Date(kpi.updatedAt).toLocaleDateString(
                              'vi-VN',
                            )}
                          </div>
                        </td>

                        <td className='flex justify-center gap-4 px-6 py-4 whitespace-nowrap text-center text-sm font-medium'>
                          <Link
                            to={`/hrm/nhan-vien/kpi/${instance.id}/edit`}
                            className='px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300 inline-flex items-center justify-center'
                          >
                            <span className='material-symbols-outlined text-sm'>
                              edit
                            </span>
                          </Link>

                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa KPI này?'))
                                fetcher.submit(null, {
                                  method: 'DELETE',
                                  action: `/hrm/nhan-vien/kpi/${instance.id}/edit`,
                                });
                            }}
                            disabled={loading}
                            className='px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 
                            transition-colors duration-300 inline-flex items-center justify-center
                            disabled:bg-gray-300 disabled:cursor-not-allowed'
                          >
                            <span className='material-symbols-outlined text-sm'>
                              delete
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                );
              }}
            </Defer>
          </tbody>
        </table>
      </div>
    </div>
  );
}
