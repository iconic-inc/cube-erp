import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { Link, useFetcher, useNavigate } from '@remix-run/react';

import { action } from '~/routes/erp+/_admin+/crm+/cases+/new';
import { format } from 'date-fns';
import { CASE_SERVICE } from '~/constants/caseService.constant';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { IEmployee, IEmployeeBrief } from '~/interfaces/employee.interface';
import { ICaseService } from '~/interfaces/case.interface';
import ItemList from '~/components/List/ItemList';
import { Button } from '~/components/ui/button';
import { Plus, XCircle, RotateCcw, Save, ArrowLeft } from 'lucide-react';
import { DatePicker } from '~/components/ui/date-picker';
import BriefEmployeeCard from '~/components/BriefEmployeeCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import TextEditor from '~/components/TextEditor/index.client';
import Hydrated from '~/components/Hydrated';
import { ICustomer } from '~/interfaces/customer.interface';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import Defer from '~/components/Defer';
import CustomerBrief from './CustomerBrief';

export default function CaseDetailForm({
  formId,
  employeesPromise,
  type,
  casePromise,
  customerPromise,
}: {
  formId: string;
  employeesPromise: ILoaderDataPromise<IListResponse<IEmployee>>;
  type: 'create' | 'update';
  casePromise?: ILoaderDataPromise<ICaseService>;
  customerPromise?: ILoaderDataPromise<ICustomer>;
}) {
  const fetcher = useFetcher<typeof action>({ key: formId });
  const toastIdRef = useRef<any>(null);
  const navigate = useNavigate();

  const [code, setCode] = useState<string>('');
  const [leadAttorney, setLeadAttorney] = useState<IEmployeeBrief | null>(null);
  const [assignees, setAssignees] = useState<IEmployeeBrief[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [status, setStatus] =
    useState<keyof typeof CASE_SERVICE.STATUS>('open');

  // Thêm state để theo dõi lỗi
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChanged, setIsChanged] = useState(false);

  const [selected, setSelectedItems] = useState<IEmployeeBrief[]>([]);

  const [employeeToRemove, setEmployeeToRemove] =
    useState<IEmployeeBrief | null>(null);
  const [employeesToAdd, setEmployeesToAdd] = useState<IEmployeeBrief[]>([]);

  // Generate case code function
  const generateCaseCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const codeGenerated = `HS${timestamp}`;
    setCode(codeGenerated);
  };

  const handleRemoveAssignee = (employee: IEmployeeBrief) => {
    setEmployeeToRemove(employee);
  };

  const confirmRemoveAssignee = () => {
    if (employeeToRemove) {
      const newAssignees = assignees.filter(
        (emp) => emp.id !== employeeToRemove.id,
      );
      setAssignees((prev) => newAssignees);
      if (leadAttorney?.id === employeeToRemove.id) {
        // If the removed employee was the lead attorney, clear it
        setLeadAttorney(newAssignees[0] || null);
      }
      setEmployeeToRemove(null);
    }
  };

  const handleAddAssignees = (employees: IEmployeeBrief[]) => {
    if (employees.length === 0) {
      toast.error('Vui lòng chọn ít nhất một nhân viên để thêm vào danh sách.');
      return;
    }

    // Check if any of the selected employees are already in the whitelist
    const newAssignees = employees.filter(
      (emp) => !assignees.some((assignee) => assignee.id === emp.id),
    );

    if (newAssignees.length === 0) {
      toast.error('Tất cả nhân viên đã có trong danh sách truy cập.');
      return;
    }

    setEmployeesToAdd(newAssignees);
  };

  const confirmAddAssignees = () => {
    if (employeesToAdd.length > 0) {
      setAssignees((prev) => [...prev, ...employeesToAdd]);
      setSelectedItems([]); // Clear selection after adding
      setEmployeesToAdd([]); // Clear the employees to add
      if (!leadAttorney) {
        // Automatically set the first added employee as lead attorney if not already set
        setLeadAttorney(employeesToAdd[0]);
      }
    }
  };

  // Xử lý form submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    const validationErrors: Record<string, string> = {};

    if (!code.trim()) {
      validationErrors.code = 'Vui lòng nhập mã Hồ sơ vụ việc';
    }

    if (assignees.length === 0) {
      validationErrors.assignees = 'Vui lòng chọn ít nhất một người thực hiện';
    }
    if (!leadAttorney) {
      validationErrors.leadAttorney = 'Vui lòng chọn luật sư chính';
    }

    // If there are validation errors, show them and prevent form submission
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(Object.values(validationErrors)[0]);
      return;
    }

    // Clear errors
    setErrors({});

    // Create FormData
    const formData = new FormData(e.currentTarget);

    formData.append('leadAttorney', leadAttorney!.id);

    // Manually add the assignees array to formData
    assignees
      .filter((assignee) => assignee.id !== leadAttorney?.id)
      .forEach((assignee) => {
        formData.append('assignees', assignee.id);
      });

    // Set the case status
    formData.append('status', String(status));

    if (endDate) {
      formData.append('endDate', format(endDate, 'yyyy-MM-dd'));
    } else {
      formData.append('endDate', '');
    }

    toastIdRef.current = toast.loading('Đang xử lý...');
    // Submit the form
    if (type === 'create') {
      fetcher.submit(formData, { method: 'POST' });
    } else if (type === 'update') {
      // Use PATCH for updates
      fetcher.submit(formData, { method: 'PUT' });
    }
  };

  useEffect(() => {
    // Check if any field has changed
    const hasChanged =
      code ||
      leadAttorney ||
      assignees.length > 0 ||
      notes ||
      startDate ||
      endDate ||
      status;

    setIsChanged(!!hasChanged);
  }, [code, leadAttorney, assignees, notes, startDate, endDate, status]);

  useEffect(() => {
    if (fetcher.data?.toast) {
      const { toast: toastData } = fetcher.data;
      toast.update(toastIdRef.current, {
        type: toastData.type,
        render: toastData.message,
        isLoading: false,
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: true,
        pauseOnFocusLoss: true,
      });

      // Redirect if success
      if (fetcher.data?.redirectTo) {
        navigate(fetcher.data.redirectTo, { replace: true });
      }
    }
  }, [fetcher.data]);

  // false by default if type is 'update', true after resolve the casePromise
  const [isContentReady, setIsContentReady] = useState(type !== 'update');
  // Fetch and load case data when in edit mode
  useEffect(() => {
    if (type === 'update' && casePromise) {
      const loadCase = async () => {
        try {
          const caseData = await casePromise;

          if (caseData && 'id' in caseData) {
            setCode(caseData.case_code || '');
            setNotes(caseData.case_notes || '');
            setLeadAttorney(caseData.case_leadAttorney || null);
            setStatus(
              (caseData.case_status as keyof typeof CASE_SERVICE.STATUS) ||
                'OPEN',
            );

            // Convert string dates to Date objects
            if (caseData.case_startDate) {
              setStartDate(new Date(caseData.case_startDate));
            }

            if (caseData.case_endDate) {
              setEndDate(new Date(caseData.case_endDate));
            }

            // Set assignees if available
            if (
              caseData.case_assignees &&
              Array.isArray(caseData.case_assignees)
            ) {
              setAssignees([
                ...(caseData.case_assignees || []),
                ...(caseData.case_leadAttorney
                  ? [caseData.case_leadAttorney]
                  : []),
              ]);
            }
          } else {
            console.error('Case data is not in the expected format:', caseData);
            toast.error('Không thể tải dữ liệu case. Vui lòng thử lại sau.');
          }
        } catch (error) {
          console.error('Error loading case data:', error);
          toast.error('Không thể tải dữ liệu case. Vui lòng thử lại sau.');
        }
      };

      loadCase().then(() => {
        setIsContentReady(true);
      });
    }
  }, [type, casePromise]);

  return (
    <fetcher.Form
      id={formId}
      method={type === 'create' ? 'POST' : 'PUT'}
      onSubmit={handleSubmit}
    >
      <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
        <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 rounded-t-xl'>
          <CardTitle className='text-white text-xl sm:text-2xl lg:text-3xl font-bold truncate'>
            {code || 'Mã Hồ sơ vụ việc'}
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
          <Defer resolve={customerPromise}>
            {(customer) => <CustomerBrief customer={customer} />}
          </Defer>

          <div>
            <Label
              htmlFor='case_code'
              className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
            >
              Mã Hồ sơ vụ việc <span className='text-red-500'>*</span>
            </Label>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
              <Input
                id='case_code'
                name='code'
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder='Ví dụ: HS123456'
                className='bg-white border-gray-300 text-sm sm:text-base'
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={generateCaseCode}
                className='whitespace-nowrap justify-center sm:justify-start'
              >
                <RotateCcw className='h-4 w-4 mr-1' />
                <span className='hidden sm:inline'>Tự động tạo</span>
                <span className='sm:hidden'>Tạo</span>
              </Button>
            </div>
            {errors.code && (
              <p className='text-red-500 text-xs sm:text-sm mt-1'>
                {errors.code}
              </p>
            )}
          </div>

          {/* Case Notes */}
          <div>
            <Label className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'>
              Ghi chú
            </Label>

            <Hydrated>
              {() => (
                <TextEditor
                  name='notes'
                  value={notes}
                  isReady={isContentReady}
                  onChange={setNotes}
                  className='min-h-48 sm:min-h-40'
                  placeholder='Nhập ghi chú cho dịch vụ vụ việc này...'
                />
              )}
            </Hydrated>
          </div>

          {/* Start Date, End Date */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
            <div>
              <Label className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'>
                Trạng thái
              </Label>
              <Select
                value={status}
                name='status'
                onValueChange={(value) =>
                  setStatus(value as keyof typeof CASE_SERVICE.STATUS)
                }
              >
                <SelectTrigger className='text-sm sm:text-base'>
                  <SelectValue placeholder='Chọn trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CASE_SERVICE.STATUS).map((status) => (
                    <SelectItem key={status} value={status}>
                      {
                        CASE_SERVICE.STATUS[
                          status as keyof typeof CASE_SERVICE.STATUS
                        ]
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor='case_startDate'
                className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
              >
                Ngày bắt đầu <span className='text-red-500'>*</span>
              </Label>

              <DatePicker
                id='case_startDate'
                name='startDate'
                initialDate={startDate}
                onChange={(date) => setStartDate(date)}
              />
            </div>

            <div>
              <Label
                htmlFor='case_endDate'
                className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
              >
                Ngày kết thúc (Tùy chọn)
              </Label>
              <DatePicker
                id='case_endDate'
                initialDate={endDate}
                onChange={(date) => setEndDate(date)}
              />
            </div>
          </div>

          <div className='border-t border-gray-200 pt-4 sm:pt-6'>
            <Label
              htmlFor='assignees'
              className='text-gray-700 font-semibold block flex items-center text-sm sm:text-base'
            >
              <span className='text-teal-600 mr-2'>
                &#128100; Người thực hiện
              </span>
            </Label>
            {errors.assignees && (
              <p className='text-red-500 text-xs sm:text-sm mt-2 sm:mt-4'>
                {errors.assignees}
              </p>
            )}

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6'>
              {assignees.map((assignee, i) => (
                <BriefEmployeeCard
                  key={i}
                  employee={assignee}
                  handleRemoveEmployee={handleRemoveAssignee}
                  onClick={() => {
                    setLeadAttorney(assignee);
                  }}
                  highlighted={assignee.id === leadAttorney?.id}
                  highlightText='Luật sư chính'
                />
              ))}
            </div>

            {/* AlertDialog for employee removal confirmation */}
            <AlertDialog
              open={!!employeeToRemove}
              onOpenChange={(open) => !open && setEmployeeToRemove(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc muốn xóa{' '}
                    {employeeToRemove?.emp_user.usr_firstName}{' '}
                    {employeeToRemove?.emp_user.usr_lastName} khỏi danh sách
                    người thực hiện?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel type='button'>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    variant='destructive'
                    onClick={confirmRemoveAssignee}
                    type='button'
                  >
                    Xác nhận
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className='mt-3 sm:mt-4 border border-dashed border-gray-300 rounded-lg bg-gray-50'>
              {!!selected.length && (
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-blue-100 border border-blue-200 text-blue-800 gap-2 sm:gap-0'>
                  <div className=''>
                    <span className='font-semibold text-xs sm:text-sm'>{`Đã chọn ${selected.length} Nhân viên để thêm`}</span>
                  </div>

                  <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto'>
                    <Button
                      variant='ghost'
                      size='sm'
                      type='button'
                      onClick={() => setSelectedItems([])} // Clear selection
                      className='text-blue-700 hover:bg-blue-200 flex items-center space-x-1 text-xs sm:text-sm'
                    >
                      <XCircle className='h-3 w-3 sm:h-4 sm:w-4' />
                      <span>Bỏ chọn tất cả</span>
                    </Button>

                    <Button
                      size='sm'
                      onClick={() => {
                        handleAddAssignees(selected);
                      }}
                      type='button'
                      className='bg-blue-500 hover:bg-blue-400 flex items-center space-x-1 text-xs sm:text-sm'
                    >
                      <Plus className='h-3 w-3 sm:h-4 sm:w-4' />
                      <span>Thêm đã chọn</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* AlertDialog for adding assignees confirmation */}
              <AlertDialog
                open={employeesToAdd.length > 0}
                onOpenChange={(open) => !open && setEmployeesToAdd([])}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận thêm nhân viên</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc muốn thêm {employeesToAdd.length} nhân viên
                      vào danh sách người thực hiện không?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel type='button'>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      variant='primary'
                      onClick={confirmAddAssignees}
                      type='button'
                    >
                      Xác nhận
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <ItemList<IEmployeeBrief>
                addNewHandler={() => {
                  navigate('/erp/employees/new');
                }}
                itemsPromise={employeesPromise}
                name='Nhân viên'
                visibleColumns={[
                  {
                    key: 'emp_user.usr_firstName',
                    title: 'Tên nhân viên',
                    visible: true,
                    render: (item) => (
                      <a
                        href={`/erp/employees/${item.id}`}
                        className='flex items-center space-x-3'
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <span>
                          {item.emp_user.usr_firstName}{' '}
                          {item.emp_user.usr_lastName}
                        </span>
                      </a>
                    ),
                  },
                  {
                    key: 'emp_user.usr_username',
                    title: 'Tài khoản',
                    visible: true,
                    render: (item) => item.emp_user.usr_username,
                  },
                  {
                    key: 'emp_position',
                    title: 'Chức vụ',
                    visible: true,
                    render: (item) => item.emp_position,
                  },
                  {
                    key: 'action',
                    title: 'Hành động',
                    visible: true,
                    render: (item) => {
                      const isAdded = !!assignees.find(
                        (selectedAssignee) => selectedAssignee.id === item.id,
                      );

                      return (
                        <Button
                          variant='default'
                          className={`bg-blue-500 hover:bg-blue-400 ${
                            isAdded ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          type='button'
                          onClick={() => {
                            handleAddAssignees([item]);
                          }}
                        >
                          {isAdded ? 'Đã thêm' : 'Thêm'}
                        </Button>
                      );
                    },
                  },
                ]}
                selectedItems={selected}
                setSelectedItems={setSelectedItems}
                showPagination={false}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className='p-4 sm:p-6'>
          <div className='w-full flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0'>
            <Link
              to='/erp/crm/customers'
              className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm flex items-center transition-all duration-300 w-full sm:w-auto justify-center'
            >
              <ArrowLeft className='h-4 w-4' />
              <span className='hidden sm:inline'>Trở về Danh sách</span>
              <span className='sm:hidden'>Trở về</span>
            </Link>

            <div className='flex space-x-2 w-full sm:w-auto'>
              <Button
                className='bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm flex items-center transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5 flex-1 sm:flex-initial justify-center'
                type='submit'
                form={formId}
                disabled={!isChanged}
              >
                <Save className='h-4 w-4' />
                <span className='hidden sm:inline'>Lưu Hồ sơ</span>
                <span className='sm:hidden'>Lưu</span>
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </fetcher.Form>
  );
}
