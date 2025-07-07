import { useState, useEffect, useRef, useMemo } from 'react';
import { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { toast } from 'react-toastify';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { formatDate } from '~/utils';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  deleteDocument,
  getDocumentById,
  updateDocument,
} from '~/services/document.server';
import { isAuthenticated } from '~/services/auth.server';
import {
  data,
  Link,
  useFetcher,
  useLoaderData,
  useNavigate,
} from '@remix-run/react';
import { parseAuthCookie } from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';
import Defer from '~/components/Defer';
import { Plus, Save, XCircle } from 'lucide-react';
import TextEditor from '~/components/TextEditor/index.client';
import Hydrated from '~/components/Hydrated';
import { IEmployee, IEmployeeBrief } from '~/interfaces/employee.interface';
import { getEmployees } from '~/services/employee.server';
import ItemList from '~/components/List/ItemList';
import { Badge } from '~/components/ui/badge';
import { Switch } from '~/components/ui/switch';
import BriefEmployeeCard from '~/components/BriefEmployeeCard';
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
import { generateFormId } from '~/utils';
import { canAccessDocumentManagement } from '~/utils/permission';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (!canAccessDocumentManagement(user?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = Number(url.searchParams.get('limit')) || 10;

  try {
    // Fetch document details from the API
    const documentId = params.documentId as string;
    const document = await getDocumentById(documentId, user!);
    const employeesPromise = getEmployees(
      {},
      {
        limit,
        page,
      },
      user!,
    ).catch((e) => {
      console.error('Error fetching employees:', e);
      return {
        success: false,
        message: 'Xảy ra lỗi khi lấy danh sách nhân viên',
      };
    });

    return { document, employeesPromise };
  } catch (error) {
    console.error('Error fetching document:', error);
    throw new Response('Document not found', {
      status: 404,
      statusText: 'Not Found',
    });
  }
};

export default function DocumentDetailPage() {
  const { document, employeesPromise } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();
  const toastIdRef = useRef<any>(null);

  const formId = useMemo(() => generateFormId('document-edit-form'), []);

  const [description, setDescription] = useState(
    document.doc_description || '',
  );
  const [name, setName] = useState(document.doc_name || '');
  const [type, setType] = useState(document.doc_type || '');
  const [whiteList, setWhiteList] = useState<IEmployeeBrief[]>(
    document.doc_whiteList || [],
  );
  const [isPublic, setIsPublic] = useState(document.doc_isPublic || false);
  const [selectedEmployees, setSelectedItems] = useState<IEmployeeBrief[]>([]);

  // State management
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isChanged, setIsChanged] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] =
    useState<IEmployeeBrief | null>(null);
  const [employeesToAdd, setEmployeesToAdd] = useState<IEmployeeBrief[]>([]);

  // Track changes
  useEffect(() => {
    const hasChanged =
      name !== document.doc_name ||
      type !== document.doc_type ||
      description !== document.doc_description ||
      isPublic !== document.doc_isPublic ||
      JSON.stringify(whiteList.map((emp) => emp.id)) !==
        JSON.stringify(document.doc_whiteList?.map((emp) => emp.id) || []);

    setIsChanged(hasChanged);
  }, [name, type, description, isPublic, whiteList, document]);

  const handleRemoveEmployee = (employee: IEmployeeBrief) => {
    if (employee.id === document.doc_createdBy?.id) {
      toast.error(
        'Bạn không thể xóa người tạo tài liệu khỏi danh sách truy cập.',
      );
      return;
    }
    setEmployeeToRemove(employee);
  };

  const confirmRemoveEmployee = () => {
    if (employeeToRemove) {
      setWhiteList((prev) =>
        prev.filter((emp) => emp.id !== employeeToRemove.id),
      );
      setEmployeeToRemove(null);
    }
  };

  const handleAddEmployees = (employees: IEmployeeBrief[]) => {
    if (employees.length === 0) {
      toast.error('Vui lòng chọn ít nhất một nhân viên để thêm vào danh sách.');
      return;
    }

    // Check if any of the selected employees are already in the whitelist
    const newEmployees = employees.filter(
      (emp) =>
        !whiteList.some((whitelistedEmp) => whitelistedEmp.id === emp.id),
    );

    if (newEmployees.length === 0) {
      toast.error('Tất cả nhân viên đã có trong danh sách truy cập.');
      return;
    }

    setEmployeesToAdd(newEmployees);
  };

  const confirmAddEmployees = () => {
    if (employeesToAdd.length > 0) {
      setWhiteList((prev) => [...prev, ...employeesToAdd]);
      setSelectedItems([]); // Clear selection after adding
      setEmployeesToAdd([]); // Clear the employees to add
    }
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    const validationErrors: Record<string, string> = {};

    if (!name.trim()) {
      validationErrors.name = 'Vui lòng nhập tên tài liệu';
    }

    if (!type.trim()) {
      validationErrors.type = 'Vui lòng nhập loại tài liệu';
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

    // Add whitelist data
    formData.set('whiteList', JSON.stringify(whiteList.map((emp) => emp.id)));
    formData.set('isPublic', String(isPublic));

    toastIdRef.current = toast.loading('Đang cập nhật tài liệu...');

    // Submit the form
    fetcher.submit(formData, { method: 'POST' });
  };

  useEffect(() => {
    // Check if the document is editable
    const confirmReload = (e: any) => {
      if (isChanged) {
        return 'Bạn có chắc muốn rời khỏi trang này? Tất cả thay đổi sẽ không được lưu.';
      }
    };

    window.onbeforeunload = confirmReload;

    return () => {
      window.onbeforeunload = null;
    };
  }, [isChanged]);

  // Handle toast notifications and redirects
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
      if (toastData.type === 'success') {
        navigate(`/erp/documents/${document.id}`, { replace: true });
      }
    }
  }, [fetcher.data, navigate, document.id]);

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      <ContentHeader
        title='Chỉnh sửa tài liệu'
        actionContent={
          <>
            <Save />
            Lưu tài liệu
          </>
        }
        actionHandler={() => {
          const form = globalThis.document.getElementById(
            formId,
          ) as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }}
        actionVariant={'primary'}
      />

      <fetcher.Form id={formId} method='POST' onSubmit={handleSubmit}>
        <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
          <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-6 rounded-t-xl'>
            <CardTitle className='text-white text-3xl font-bold flex items-center justify-between'>
              {name || 'Tài liệu'}
              <Badge
                variant={isPublic ? 'default' : 'secondary'}
                className={`ml-3 text-sm px-3 py-1 rounded-full ${
                  isPublic
                    ? 'bg-green-500 text-white'
                    : 'bg-yellow-500 text-white'
                }`}
              >
                {isPublic ? 'Công khai' : 'Hạn chế'}
              </Badge>
            </CardTitle>
            <CardDescription className='text-purple-100 mt-2'>
              <span>ID: {document.id}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className='p-6 space-y-6'>
            {/* Document Name and Type */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <Label
                  htmlFor='name'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Tên tài liệu <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='name'
                  name='name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='bg-white border-gray-300'
                  placeholder='Nhập tên tài liệu'
                  required
                />
                {errors.name && (
                  <p className='text-red-500 text-sm mt-1'>{errors.name}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor='type'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Loại tài liệu <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='type'
                  name='type'
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className='bg-white border-gray-300'
                  placeholder='Nhập loại tài liệu'
                  required
                />
                {errors.type && (
                  <p className='text-red-500 text-sm mt-1'>{errors.type}</p>
                )}
              </div>
            </div>

            {/* Document Description */}
            <div>
              <Label
                htmlFor='docDescription'
                className='text-gray-700 font-semibold mb-2 block'
              >
                Mô tả
              </Label>
              <div className='h-80'>
                <Hydrated>
                  {() => (
                    <TextEditor
                      name='description'
                      onChange={setDescription}
                      value={description}
                      placeholder='Nhập mô tả tài liệu...'
                    />
                  )}
                </Hydrated>
              </div>
            </div>

            {/* Document Creator */}
            {document.doc_createdBy && (
              <div className='border-t border-gray-200 pt-6'>
                <h4 className='text-xl font-bold text-gray-800 mb-4 flex items-center'>
                  <span className='text-purple-600 mr-2'>ℹ️</span> Người tạo
                </h4>
                <div className='flex items-center space-x-4 p-4 w-full md:w-1/2 lg:w-1/3 bg-purple-50 rounded-lg shadow-sm border border-purple-200'>
                  <Avatar className='h-14 w-14 border-2 border-purple-400'>
                    <AvatarImage
                      src={document.doc_createdBy.emp_user.usr_avatar?.img_url}
                      alt={`${document.doc_createdBy.emp_user.usr_firstName} ${document.doc_createdBy.emp_user.usr_lastName} Avatar`}
                    />
                    <AvatarFallback>
                      {`${document.doc_createdBy.emp_user.usr_firstName[0]}${document.doc_createdBy.emp_user.usr_lastName[0]}`}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='text-lg font-semibold text-gray-900'>
                      {document.doc_createdBy.emp_user.usr_firstName}{' '}
                      {document.doc_createdBy.emp_user.usr_lastName}
                    </p>
                    <p className='text-sm text-gray-600'>
                      @{document.doc_createdBy.emp_user.usr_username} (
                      {document.doc_createdBy.emp_position})
                    </p>
                    <p className='text-sm text-gray-500'>
                      {document.doc_createdBy.emp_user.usr_email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Access Control */}
            <div className='border-t border-gray-200 pt-6'>
              <div className='flex items-center justify-between mb-4'>
                <Label
                  htmlFor='isPublic'
                  className='text-gray-700 font-semibold'
                >
                  Chế độ truy cập
                </Label>
                <div className='flex items-center space-x-4'>
                  <Switch
                    id='isPublic'
                    name='isPublic'
                    checked={isPublic}
                    onCheckedChange={(checked) => setIsPublic(checked)}
                    className='data-[state=checked]:bg-green-500'
                  />
                  <Badge
                    variant={isPublic ? 'default' : 'secondary'}
                    className={`text-sm px-3 py-1 rounded-full ${
                      isPublic
                        ? 'bg-green-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}
                  >
                    {isPublic ? 'Công khai' : 'Hạn chế'}
                  </Badge>
                </div>
              </div>

              {/* Employee Access List */}
              <div>
                <h4 className='text-xl font-bold text-gray-800 mb-4 flex items-center'>
                  <span className='text-indigo-600 mr-2'>🔒</span> Danh sách
                  nhân viên được phép truy cập
                </h4>

                {isPublic ? (
                  <div className='p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50'>
                    <p className='text-gray-600'>
                      Tài liệu này đang ở chế độ công khai. Tất cả nhân viên
                      trong hệ thống đều có thể truy cập tài liệu này.
                    </p>
                  </div>
                ) : (
                  <>
                    {whiteList.length > 0 && (
                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4'>
                        {whiteList.map((employee) => (
                          <BriefEmployeeCard
                            key={employee.id}
                            employee={employee}
                            handleRemoveEmployee={handleRemoveEmployee}
                          />
                        ))}
                      </div>
                    )}

                    <Defer resolve={employeesPromise}>
                      {(employeeData) => (
                        <div className='p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50'>
                          {!!selectedEmployees.length && (
                            <div className='flex items-center justify-between p-3 bg-blue-100 border border-blue-200 text-blue-800 mb-4 rounded-lg'>
                              <div>
                                <span className='font-semibold text-sm'>
                                  Đã chọn {selectedEmployees.length} nhân viên
                                  để thêm
                                </span>
                              </div>
                              <div className='flex flex-wrap items-center gap-2'>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  type='button'
                                  onClick={() => setSelectedItems([])}
                                  className='text-blue-700 hover:bg-blue-200 flex items-center space-x-1'
                                >
                                  <XCircle className='h-4 w-4' />
                                  <span>Bỏ chọn tất cả</span>
                                </Button>
                                <Button
                                  size='sm'
                                  type='button'
                                  onClick={() =>
                                    handleAddEmployees(selectedEmployees)
                                  }
                                  className='bg-blue-500 hover:bg-blue-400 flex items-center space-x-1'
                                >
                                  <Plus className='h-4 w-4' />
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
                                  <Link
                                    to={`/erp/employees/${item.id}`}
                                    className='flex items-center space-x-3'
                                  >
                                    <span>
                                      {item.emp_user.usr_firstName}{' '}
                                      {item.emp_user.usr_lastName}
                                    </span>
                                  </Link>
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
                                  const isAdded = !!whiteList.find(
                                    (emp) => emp.id === item.id,
                                  );

                                  return (
                                    <Button
                                      variant='default'
                                      className={`bg-blue-500 hover:bg-blue-400 ${
                                        isAdded
                                          ? 'opacity-50 cursor-not-allowed'
                                          : ''
                                      }`}
                                      type='button'
                                      onClick={() => handleAddEmployees([item])}
                                      disabled={isAdded}
                                    >
                                      {isAdded ? 'Đã thêm' : 'Thêm'}
                                    </Button>
                                  );
                                },
                              },
                            ]}
                            selectedItems={selectedEmployees}
                            setSelectedItems={setSelectedItems}
                          />
                        </div>
                      )}
                    </Defer>
                  </>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className='bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200'>
            <Link
              to='/erp/documents'
              className='bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center transition-all duration-300'
            >
              <span className='material-symbols-outlined text-sm mr-1'>
                keyboard_return
              </span>
              Trở về Danh sách
            </Link>

            <div className='flex space-x-2'>
              <Button
                variant='destructive'
                type='button'
                onClick={() => {
                  if (
                    confirm(
                      'Bạn có chắc muốn xóa tài liệu này không? Tất cả dữ liệu sẽ bị mất vĩnh viễn.',
                    )
                  ) {
                    fetcher.submit(
                      {},
                      {
                        method: 'DELETE',
                        action: `/erp/documents/${document.id}/edit`,
                      },
                    );
                  }
                }}
              >
                Xóa tài liệu
              </Button>

              <Button
                type='submit'
                disabled={!isChanged || fetcher.state === 'submitting'}
              >
                {fetcher.state === 'submitting' ? (
                  <>
                    <span className='animate-spin mr-2'>⏳</span>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <span className='material-symbols-outlined text-sm mr-1'>
                      save
                    </span>
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
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
                {employeeToRemove?.emp_user.usr_lastName} khỏi danh sách truy
                cập?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel type='button'>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRemoveEmployee} type='button'>
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
                sách truy cập không?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel type='button'>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={confirmAddEmployees} type='button'>
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </fetcher.Form>
    </div>
  );
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  switch (request.method) {
    case 'DELETE':
      await deleteDocument(params.documentId!, session!);
      return data(
        {
          toast: {
            type: 'success' as const,
            message: 'Xóa Tài liệu thành công',
          },
        },
        { headers },
      );

    case 'POST':
      const formData = await request.formData();
      const name = formData.get('name')?.toString().trim();
      const type = formData.get('type')?.toString().trim();
      const description = formData.get('description')?.toString().trim();
      const whiteList = formData.get('whiteList')
        ? JSON.parse(formData.get('whiteList')!.toString())
        : [];
      const isPublic = formData.get('isPublic') === 'true';
      const documentId = params.documentId as string;
      if (!name || !type) {
        return data(
          {
            toast: {
              type: 'error' as const,
              message: 'Vui lòng điền đầy đủ thông tin tên và loại tài liệu.',
            },
          },
          { status: 400, statusText: 'Bad Request' },
        );
      }
      try {
        await updateDocument(
          documentId,
          { name, type, description, whiteList, isPublic },
          session!,
        );
        return data(
          {
            toast: {
              type: 'success' as const,
              message: 'Cập nhật tài liệu thành công',
            },
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error updating document:', error);
        return data(
          {
            toast: {
              type: 'error' as const,
              message:
                error.message ||
                'Đã xảy ra lỗi khi cập nhật tài liệu. Vui lòng thử lại sau.',
            },
          },
          { status: 500, statusText: 'Internal Server Error' },
        );
      }

    default:
      return data(
        {
          toast: {
            type: 'error' as const,
            message: 'Phương thức không hợp lệ',
          },
        },
        {
          status: 405,
          statusText: 'Method Not Allowed',
        },
      );
  }
};
