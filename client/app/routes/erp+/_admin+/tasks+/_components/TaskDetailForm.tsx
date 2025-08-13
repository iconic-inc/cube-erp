import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { Link, useFetcher, useNavigate } from '@remix-run/react';

import { action } from '~/routes/erp+/_admin+/tasks+/new';
import { format } from 'date-fns';
import { TASK } from '~/constants/task.constant';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { IEmployee, IEmployeeBrief } from '~/interfaces/employee.interface';
import { ITask } from '~/interfaces/task.interface';
import ItemList from '~/components/List/ItemList';
import { Button } from '~/components/ui/button';
import { ArrowLeft, Plus, Save, XCircle } from 'lucide-react';
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
import { ICaseService } from '~/interfaces/case.interface';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import Defer from '~/components/Defer';
import CaseServiceBrief from './CaseServiceBrief';
import { useERPLoaderData } from '~/lib';

export default function TaskDetailForm({
  formId,
  employees,
  type,
  taskPromise,
  casePromise,
}: {
  formId: string;
  employees: ILoaderDataPromise<IListResponse<IEmployeeBrief>>;
  type: 'create' | 'update';
  taskPromise?: ILoaderDataPromise<ITask>;
  casePromise?: ILoaderDataPromise<ICaseService>;
}) {
  const { employee } = useERPLoaderData();
  const fetcher = useFetcher<typeof action>({ key: formId });
  const toastIdRef = useRef<any>(null);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignees, setAssignees] = useState<IEmployeeBrief[]>(
    employee ? [employee] : [],
  );
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [caseOrder, setCaseOrder] = useState<number>(0);
  const [endDate, setEndDate] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  );
  const [priority, setPriority] =
    useState<keyof typeof TASK.PRIORITY>('medium');

  // State for task status
  const [status, setStatus] = useState<keyof typeof TASK.STATUS>('not_started');
  const [caseService, setCaseService] = useState<ICaseService | null>(null);

  // Thêm state để theo dõi lỗi
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChanged, setIsChanged] = useState(false);

  const [selected, setSelectedItems] = useState<IEmployeeBrief[]>([]);

  const [employeeToRemove, setEmployeeToRemove] =
    useState<IEmployeeBrief | null>(null);
  const [employeesToAdd, setEmployeesToAdd] = useState<IEmployeeBrief[]>([]);

  const handleRemoveAssignee = (employee: IEmployeeBrief) => {
    setEmployeeToRemove(employee);
  };

  const confirmRemoveAssignee = () => {
    if (employeeToRemove) {
      setAssignees((prev) =>
        prev.filter((emp) => emp.id !== employeeToRemove.id),
      );
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
    }
  };

  // Xử lý form submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    const validationErrors: Record<string, string> = {};

    if (!name.trim()) {
      validationErrors.name = 'Vui lòng nhập tên Task';
    }

    if (!endDate) {
      validationErrors.endDate = 'Vui lòng chọn ngày kết thúc';
    }

    if (assignees.length === 0) {
      validationErrors.assignees = 'Vui lòng chọn ít nhất một người thực hiện';
    }

    // If there are validation errors, show them and prevent form submission
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      Object.values(validationErrors).forEach((error) => {
        toast.error(error);
      });
      return;
    }

    // Clear errors
    setErrors({});

    // Create FormData
    const formData = new FormData(e.currentTarget);

    // Manually add the assignees array to formData
    assignees.forEach((assignee) => {
      formData.append('assignees', assignee.id);
    });

    // Set the task status
    formData.append('status', status);

    toastIdRef.current = toast.loading('Đang xử lý...');
    // Submit the form
    if (type === 'create') {
      fetcher.submit(formData, { method: 'POST' });
    } else if (type === 'update') {
      // Use PATCH for updates
      fetcher.submit(formData, { method: 'PUT' });
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
  };

  useEffect(() => {
    // Check if any field has changed
    const hasChanged =
      name ||
      description ||
      assignees.length > 0 ||
      startDate ||
      endDate ||
      priority ||
      status;

    setIsChanged(!!hasChanged);
  }, [
    name,
    description,
    assignees,
    startDate,
    endDate,
    priority,
    status,
    setIsChanged,
  ]);

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
      if (fetcher.data.toast.type === 'success' && fetcher.data.redirectTo) {
        navigate(fetcher.data.redirectTo);
      }
    }
  }, [fetcher.data]);

  // false by default if type is 'update', true after resolve the casePromise
  const [isContentReady, setIsContentReady] = useState(type !== 'update');
  // Fetch and load task data when in edit mode
  useEffect(() => {
    if (type === 'update' && taskPromise) {
      const loadTask = async () => {
        try {
          const task = await taskPromise;
          if (task && 'id' in task) {
            setName(task.tsk_name || '');
            setDescription(task.tsk_description || '');
            setPriority(
              (task.tsk_priority as keyof typeof TASK.PRIORITY) || 'medium',
            );
            setStatus(
              (task.tsk_status as keyof typeof TASK.STATUS) || 'not_started',
            );
            setCaseService(task.tsk_caseService || null);
            setCaseOrder(task.tsk_caseOrder || 0);

            // Convert string dates to Date objects
            if (task.tsk_startDate) {
              setStartDate(new Date(task.tsk_startDate));
            }

            if (task.tsk_endDate) {
              setEndDate(new Date(task.tsk_endDate));
            }

            // Set assignees if available
            if (task.tsk_assignees && Array.isArray(task.tsk_assignees)) {
              setAssignees(task.tsk_assignees);
            }
          } else {
            console.error('Task data is not in the expected format:', task);
            toast.error('Không thể tải dữ liệu task. Vui lòng thử lại sau.');
          }
        } catch (error) {
          console.error('Error loading task data:', error);
          toast.error('Không thể tải dữ liệu task. Vui lòng thử lại sau.');
        }
      };

      loadTask().then(() => {
        setIsContentReady(true);
      });
    }
    if (type === 'create' && casePromise) {
      const loadCase = async () => {
        try {
          const caseData = await casePromise;
          if (caseData && 'id' in caseData) {
            setCaseService(caseData);
            setAssignees([
              ...(caseData.case_assignees || []),
              ...(caseData.case_leadAttorney
                ? [caseData.case_leadAttorney]
                : []),
            ]);
            setStartDate(new Date(caseData.case_startDate));
          } else {
            console.error('Case data is not in the expected format:', caseData);
            toast.error('Không thể tải dữ liệu hồ sơ. Vui lòng thử lại sau.');
          }
        } catch (error) {
          console.error('Error loading case data:', error);
          toast.error('Không thể tải dữ liệu hồ sơ. Vui lòng thử lại sau.');
        }
      };
      loadCase();
    }
  }, [type, taskPromise, casePromise]);

  return (
    <fetcher.Form
      id={formId}
      method={type === 'create' ? 'POST' : 'PUT'}
      onSubmit={handleSubmit}
    >
      <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
        <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 rounded-t-xl'>
          <CardTitle className='text-white text-xl sm:text-2xl lg:text-3xl font-bold'>
            {type === 'create'
              ? 'Tạo Task mới'
              : `Task: ${name || 'Chưa có tên'}`}
          </CardTitle>
        </CardHeader>

        <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
          {/* Case Service Brief */}
          {caseService && (
            <div className='mb-6'>
              <CaseServiceBrief caseService={caseService} />
              <input type='hidden' name='caseService' value={caseService.id} />
            </div>
          )}

          {/* Task Name and Order */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6'>
            <div className='lg:col-span-8'>
              <Label
                htmlFor='name'
                className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
              >
                Tên Task <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='name'
                name='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='bg-white border-gray-300 text-sm sm:text-base'
                placeholder='Nhập tên Task'
                required
              />
              {errors.name && (
                <p className='text-red-500 text-xs sm:text-sm mt-1'>
                  {errors.name}
                </p>
              )}
            </div>

            <div className='lg:col-span-4'>
              <Label
                htmlFor='caseOrder'
                className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
              >
                Thứ tự
              </Label>
              <Input
                id='caseOrder'
                name='caseOrder'
                type='number'
                value={caseOrder}
                onChange={(e) => setCaseOrder(Number(e.target.value))}
                className='bg-white border-gray-300 text-sm sm:text-base'
                placeholder='Nhập thứ tự'
                required
              />
            </div>
          </div>

          {/* Task Description */}
          <div>
            <Label
              htmlFor='description'
              className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
            >
              Mô tả
            </Label>
            <Hydrated>
              {() => (
                <div className='h-[250px] sm:h-[200px]'>
                  <TextEditor
                    name='description'
                    value={description}
                    isReady={isContentReady}
                    onChange={handleDescriptionChange}
                    placeholder='Nhập mô tả chi tiết cho Task'
                  />
                </div>
              )}
            </Hydrated>
          </div>

          {/* Priority, Status, Dates */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6'>
            <div className='lg:col-span-2'>
              <Label
                htmlFor='priority'
                className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
              >
                Độ ưu tiên
              </Label>
              <Select
                name='priority'
                value={priority}
                onValueChange={(value) =>
                  setPriority(value as keyof typeof TASK.PRIORITY)
                }
              >
                <SelectTrigger className='w-full focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'>
                  <SelectValue placeholder='Chọn độ ưu tiên' />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK.PRIORITY).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='lg:col-span-2'>
              <Label
                htmlFor='status'
                className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
              >
                Trạng thái
              </Label>
              <Select
                name='status'
                value={status}
                onValueChange={(value) =>
                  setStatus(value as keyof typeof TASK.STATUS)
                }
              >
                <SelectTrigger className='w-full focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'>
                  <SelectValue placeholder='Chọn trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK.STATUS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='lg:col-span-4'>
              <Label
                htmlFor='startDate'
                className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
              >
                Ngày bắt đầu
              </Label>
              <DatePicker
                name='startDate'
                type='datetime-local'
                id='startDate'
                initialDate={startDate}
                onChange={(date) => setStartDate(date)}
              />
            </div>

            <div className='lg:col-span-4'>
              <Label
                htmlFor='endDate'
                className='text-gray-700 font-semibold mb-2 block text-sm sm:text-base'
              >
                Ngày kết thúc <span className='text-red-500'>*</span>
              </Label>
              <DatePicker
                id='endDate'
                name='endDate'
                type='datetime-local'
                initialDate={endDate}
                onChange={(date) => setEndDate(date)}
              />

              {errors.endDate && (
                <p className='text-red-500 text-xs sm:text-sm mt-1'>
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Case Service Selection */}
          {!caseService && type === 'create' && (
            <div className='flex items-center justify-center py-4 sm:py-6 border-t border-gray-200'>
              <Button
                variant='primary'
                type='button'
                asChild
                className='text-sm sm:text-base'
              >
                <Link to={`/erp/cases`}>Chọn hồ sơ liên quan</Link>
              </Button>
            </div>
          )}

          {/* Assignees */}
          <div className='space-y-4'>
            <Label className='text-gray-700 font-semibold block flex items-center text-sm sm:text-base'>
              <span className='text-teal-600 mr-2'>👤</span> Người thực hiện
              {assignees.length === 0 && (
                <span className='text-red-500 ml-1'>*</span>
              )}
            </Label>

            {assignees.length > 0 && (
              <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4'>
                {assignees.map((assignee) => (
                  <BriefEmployeeCard
                    key={assignee.id}
                    employee={assignee}
                    handleRemoveEmployee={handleRemoveAssignee}
                  />
                ))}
              </div>
            )}

            {errors.assignees && (
              <p className='text-red-500 text-xs sm:text-sm'>
                {errors.assignees}
              </p>
            )}

            <Defer resolve={employees}>
              {(employeeData) => (
                <div className='sm:p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50'>
                  {!!selected.length && (
                    <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-blue-100 border border-blue-200 text-blue-800 mb-4 rounded-lg gap-2 sm:gap-0'>
                      <div>
                        <span className='font-semibold text-xs sm:text-sm'>
                          Đã chọn {selected.length} nhân viên để thêm
                        </span>
                      </div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          type='button'
                          onClick={() => setSelectedItems([])}
                          className='text-blue-700 hover:bg-blue-200 flex items-center space-x-1 text-xs sm:text-sm'
                        >
                          <XCircle className='h-3 w-3 sm:h-4 sm:w-4' />
                          <span>Bỏ chọn tất cả</span>
                        </Button>
                        <Button
                          size='sm'
                          onClick={() => handleAddAssignees(selected)}
                          type='button'
                          className='bg-blue-500 hover:bg-blue-400 flex items-center space-x-1 text-xs sm:text-sm'
                        >
                          <Plus className='h-3 w-3 sm:h-4 sm:w-4' />
                          <span>Thêm đã chọn</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  <ItemList<IEmployeeBrief>
                    addNewHandler={() => navigate('/erp/employees/new')}
                    itemsPromise={employeeData}
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
                            (selectedAssignee) =>
                              selectedAssignee.id === item.id,
                          );

                          return (
                            <Button
                              variant='default'
                              className={`bg-blue-500 hover:bg-blue-400 text-xs sm:text-sm ${
                                isAdded ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              type='button'
                              onClick={() => handleAddAssignees([item])}
                              disabled={isAdded}
                            >
                              {isAdded ? 'Đã thêm' : 'Thêm'}
                            </Button>
                          );
                        },
                      },
                    ]}
                    selectedItems={selected}
                    setSelectedItems={setSelectedItems}
                  />
                </div>
              )}
            </Defer>
          </div>
        </CardContent>

        <CardFooter className='px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 gap-3 sm:gap-0'>
          <Link
            to='/erp/tasks'
            className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm flex items-center transition-all duration-300 w-full sm:w-auto justify-center'
          >
            <ArrowLeft className='h-4 w-4 mr-1' />
            Trở về Danh sách
          </Link>

          <Button
            variant='primary'
            type='submit'
            disabled={!isChanged || fetcher.state === 'submitting'}
            className='text-xs sm:text-sm w-full sm:w-auto'
          >
            {fetcher.state === 'submitting' ? (
              <>
                <span className='animate-spin mr-2'>⏳</span>
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className='h-4 w-4' />
                {type === 'create' ? 'Lưu Task' : 'Cập nhật Task'}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Alert Dialogs */}
      <AlertDialog
        open={!!employeeToRemove}
        onOpenChange={(open) => !open && setEmployeeToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa {employeeToRemove?.emp_user.usr_firstName}{' '}
              {employeeToRemove?.emp_user.usr_lastName} khỏi danh sách người
              thực hiện?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type='button'>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveAssignee} type='button'>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={employeesToAdd.length > 0}
        onOpenChange={(open) => !open && setEmployeesToAdd([])}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thêm nhân viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn thêm {employeesToAdd.length} nhân viên vào danh
              sách người thực hiện không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type='button'>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddAssignees} type='button'>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </fetcher.Form>
  );
}
