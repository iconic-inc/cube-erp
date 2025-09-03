import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { IEmployee } from '~/interfaces/employee.interface';
import { useFetcher } from '@remix-run/react';
import { IListResponse } from '~/interfaces/response.interface';
import ItemList from '~/components/List/ItemList';
import LoadingCard from '~/components/LoadingCard';
import ErrorCard from '~/components/ErrorCard';
import { Button } from '~/components/ui/button';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';

interface EmployeePickerProps {
  onClose: () => void;
  selected?: IEmployee[];
  onSelect: (selectedEmployees: IEmployee[]) => void;
  employeeGetter: () => Promise<IListResponse<IEmployee>>;
}

export default function EmployeePicker({
  onClose,
  onSelect,
  selected = [],
  employeeGetter,
}: EmployeePickerProps) {
  const [employees, setEmployees] = useState<IListResponse<IEmployee>>({
    data: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] =
    useState<IEmployee[]>(selected);

  const handleEmployeeClick = (id: string) => {
    setSelectedEmployees((prev) => {
      const res = prev.find((employee) => employee.id === id)
        ? prev.filter((employee) => employee.id !== id) // Deselect if already selected
        : [...prev, employees.data.find((employee) => employee.id === id)!]; // Add to selection

      return res;
    });
  };

  const handleConfirm = () => {
    onSelect(selectedEmployees);
    onClose();
  };

  useEffect(() => {
    (async () => {
      try {
        const employees = await employeeGetter();

        setEmployees(employees);
      } catch (error: any) {
        console.error('Error fetching employees:', error);
        setError(error.message || 'Có lỗi xảy ra khi tải nhân viên');
      }
      setIsLoading(false);
    })();

    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', escapeHandler);

    return () => {
      document.removeEventListener('keydown', escapeHandler);
    };
  }, []);

  const fetcher = useFetcher<any>();
  const [searchTerm, setSearchTerm] = useState('');
  const { isSubmitting } = useFetcherResponseHandler(fetcher, {
    onSuccess(_, fetcher) {
      if (fetcher.formMethod === 'DELETE') {
        setEmployees((prev) => ({
          ...prev,
          data: prev.data.filter(
            (employee) => !selectedEmployees.some((d) => d.id === employee.id),
          ),
        }));
        setSelectedEmployees([]);
      }
    },
  });

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-2 sm:p-4 lg:p-8 z-50'>
      <div className='flex flex-col bg-white gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6 rounded-lg shadow-lg w-full h-full max-w-7xl max-h-[95vh] overflow-hidden'>
        <div className='flex-grow grid grid-cols-12 divide-x divide-zinc-200 gap-2 sm:gap-4 overflow-hidden'>
          <div
            className={`col-span-12 flex-grow w-full h-full divide-y divide-zinc-200 transition-all flex flex-col overflow-hidden`}
          >
            {isLoading && <LoadingCard />}
            {error && <ErrorCard message={error} />}
            {!error && !isLoading && (
              <div className='flex flex-col overflow-hidden flex-grow'>
                <div className='p-2 sm:p-4 border-b border-gray-200 flex flex-col gap-2 sm:gap-3 flex-shrink-0'>
                  <div className='relative w-full'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5' />
                    <input
                      type='text'
                      placeholder='Tìm kiếm...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='w-full pl-8 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base'
                    />
                  </div>
                </div>

                <div className='flex-grow overflow-auto'>
                  <ItemList<IEmployee>
                    itemsPromise={{
                      data: employees.data.filter((employee) =>
                        `${employee.emp_user?.usr_firstName} ${employee.emp_user?.usr_lastName}`
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                      ),
                      pagination: employees.pagination,
                    }}
                    name='nhân viên'
                    selectedItems={selectedEmployees}
                    setSelectedItems={setSelectedEmployees}
                    visibleColumns={[
                      {
                        key: 'name',
                        title: 'Tên nhân viên',
                        visible: true,
                        render: (employee) => (
                          <div className='w-[600px]'>
                            <span className='text-sm sm:text-base font-medium text-gray-800 break-words'>
                              {`${employee.emp_user?.usr_firstName} ${employee.emp_user?.usr_lastName}`}
                            </span>
                          </div>
                        ),
                      },
                      {
                        key: 'actions',
                        title: 'Hành động',
                        visible: true,
                        render: (employee) => (
                          <div className='flex items-center gap-2'>
                            <Button
                              onClick={() => handleEmployeeClick(employee.id)}
                              variant={
                                selectedEmployees.find(
                                  (d) => d.id === employee.id,
                                )
                                  ? 'destructive'
                                  : 'primary'
                              }
                              type='button'
                              className='text-sm sm:text-base'
                            >
                              <span className='hidden sm:inline'>
                                {selectedEmployees.find(
                                  (d) => d.id === employee.id,
                                )
                                  ? 'Bỏ chọn'
                                  : 'Chọn'}
                              </span>
                              <span className='sm:hidden'>
                                {selectedEmployees.find(
                                  (d) => d.id === employee.id,
                                )
                                  ? 'Bỏ'
                                  : 'Chọn'}
                              </span>
                            </Button>
                          </div>
                        ),
                      },
                    ]}
                    showPagination={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='h-fit flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 flex-shrink-0'>
          <div className='flex flex-col sm:flex-row gap-2 sm:gap-4'>
            <Button
              onClick={onClose}
              variant='secondary'
              type='button'
              className='w-full sm:w-auto'
            >
              Hủy bỏ
            </Button>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || selectedEmployees.length === 0}
            variant='primary'
            className='w-full sm:w-auto'
            type='button'
          >
            Xác nhận
          </Button>
        </div>
      </div>
    </div>
  );
}
