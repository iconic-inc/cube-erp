import { useState, useEffect, useRef } from 'react';
import { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';

import {
  Card,
  CardContent,
  CardDescription,
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
import { IEmployee } from '~/interfaces/employee.interface';
import { getEmployees } from '~/services/employee.server';
import ItemList from '~/components/List/ItemList';
import { toast } from 'react-toastify';
import { Badge } from '~/components/ui/badge';
import { Switch } from '~/components/ui/switch';
import BriefEmployeeCard from '~/components/BriefEmployeeCard';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

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

  useEffect(() => {
    // Check if the document is editable
    const confirmReload = (e: any) => {
      return 'Bạn có chắc muốn rời khỏi trang này? Tất cả thay đổi sẽ không được lưu.';
    };

    window.onbeforeunload = confirmReload;

    return () => {
      window.onbeforeunload = null;
    };
  }, []);

  const [description, setDescription] = useState(
    document.doc_description || '',
  );
  const [name, setName] = useState(document.doc_name || '');
  const [type, setType] = useState(document.doc_type || '');
  const [whiteList, setWhiteList] = useState(document.doc_whiteList || []);
  const [isPublic, setIsPublic] = useState(document.doc_isPublic || false);
  const [selectedEmployees, setSelectedItems] = useState<IEmployee[]>([]);
  const fetcher = useFetcher<typeof action>();
  const toastIdRef = useRef<any>(null);

  const handleRemoveEmployee = (employee: IEmployee) => {
    if (employee.id === document.doc_createdBy?.id) {
      alert('Bạn không thể xóa người tạo tài liệu khỏi danh sách truy cập.');
      return;
    }

    if (
      confirm(
        `Bạn có chắc muốn xóa nhân viên ${employee.emp_user.usr_firstName} ${employee.emp_user.usr_lastName} khỏi danh sách truy cập không?`,
      )
    ) {
      setWhiteList((prev) => prev.filter((emp) => emp.id !== employee.id));
    }
  };

  const handleWhileListEmployees = (employees: IEmployee[]) => {
    if (employees.length === 0) {
      alert('Vui lòng chọn ít nhất một nhân viên để thêm vào danh sách.');
      return;
    }
    if (
      confirm(
        `Bạn có chắc muốn thêm ${employees.length} nhân viên vào danh sách truy cập không?`,
      )
    ) {
      // Check if any of the selected employees are already in the whitelist
      const newWhiteList = employees.filter(
        (emp) =>
          !whiteList.some((whitelistedEmp) => whitelistedEmp.id === emp.id),
      );
      if (newWhiteList.length === 0) {
        alert('Tất cả nhân viên đã có trong danh sách truy cập.');
        return;
      }
      setWhiteList((prev) => [...prev, ...newWhiteList]);
      setSelectedItems([]); // Clear selection after adding
    }
  };

  const handleSave = async () => {
    if (!name || !type) {
      alert('Vui lòng điền đầy đủ thông tin tên và loại tài liệu.');
      return;
    }

    try {
      toastIdRef.current = toast.loading('Đang cập nhật tài liệu...');
      // Call API to update document
      fetcher.submit(
        {
          name,
          type,
          description,
          isPublic,
          whiteList: JSON.stringify(whiteList.map((emp) => emp.id)),
        },
        {
          method: 'POST',
          action: `/erp/documents/${document.id}/edit`,
        },
      );
    } catch (error) {
      console.error('Error updating document:', error);
      toast.update(toastIdRef.current, {
        render: 'Đã xảy ra lỗi khi cập nhật tài liệu. Vui lòng thử lại sau.',
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  useEffect(() => {
    if (fetcher.data?.toast) {
      const { type, message } = fetcher.data.toast;
      if (toastIdRef.current) {
        toast.update(toastIdRef.current, {
          render: message,
          type,
          isLoading: false,
          autoClose: 5000,
        });
        if (type === 'success') {
          toastIdRef.current = null; // Clear toast ID after success
          navigate(`/erp/documents/${document.id}`);
        }
      } else {
        toast[type](message);
      }
    }
  }, [fetcher.data]);

  return (
    <div className='w-full space-y-6'>
      <ContentHeader
        title='Chỉnh sửa tài liệu'
        actionContent={
          <>
            <Save />
            <span className='hidden md:inline'>Lưu</span>
          </>
        }
        actionHandler={handleSave}
        actionVariant={'primary'}
      />

      <Defer
        resolve={document}
        fallback={
          <div className='flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900'>
            <p className='text-lg text-gray-700 dark:text-gray-300'>
              Loading document details...
            </p>
          </div>
        }
      >
        {(document) => {
          const { doc_createdBy } = document;
          const creatorUser = doc_createdBy?.emp_user;

          return (
            <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
              <CardHeader className='bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-6 rounded-t-xl'>
                <CardTitle className='text-white text-3xl font-bold flex items-center justify-between'>
                  {name}
                  {/* <Badge
                    variant={document.doc_isPublic ? 'default' : 'secondary'}
                    className={`ml-3 text-sm px-3 py-1 rounded-full ${document.doc_isPublic ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}
                  >
                    {document.doc_isPublic ? 'Public' : 'Private'}
                  </Badge> */}
                </CardTitle>
                <CardDescription className='text-purple-100 mt-2'>
                  <span>ID: {document.id}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className='p-6 space-y-6'>
                <div>
                  <Label
                    htmlFor='name'
                    className='text-gray-700 font-semibold mb-2 block'
                  >
                    Tên tài liệu
                  </Label>
                  <div className='flex items-center space-x-2'>
                    <Input
                      id='name'
                      name='name'
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className='flex-grow bg-white border-gray-300 focus:ring-purple-500'
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor='type'
                    className='text-gray-700 font-semibold mb-2 block'
                  >
                    Loại tài liệu
                  </Label>
                  <div className='flex items-center space-x-2'>
                    <Input
                      id='type'
                      name='type'
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className='flex-grow bg-white border-gray-300 focus:ring-purple-500'
                    />
                  </div>
                </div>

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
                          // className='rounded-lg border border-gray-300 p-3 bg-gray-50 text-gray-800 break-words'
                          value={description}
                          placeholder='Nhập mô tả tài liệu...'
                        />
                      )}
                    </Hydrated>
                  </div>
                </div>

                {creatorUser && (
                  <div className='border-t border-gray-200 pt-6'>
                    <h4 className='col-span-12 text-xl font-bold text-gray-800 mb-4 flex items-center'>
                      <span className='text-purple-600 mr-2'>&#9432;</span>{' '}
                      Người tạo
                    </h4>
                    <div className='flex items-center space-x-4 p-4 w-full md:w-1/2 lg:w-1/3 bg-purple-50 rounded-lg shadow-sm border border-purple-200'>
                      <Avatar className='h-14 w-14 border-2 border-purple-400'>
                        <AvatarImage
                          src={creatorUser.usr_avatar?.img_url}
                          alt={`${creatorUser.usr_firstName} ${creatorUser.usr_lastName} Avatar`}
                        />

                        <AvatarFallback>{`${creatorUser.usr_firstName[0]}${creatorUser.usr_lastName[0]}`}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className='text-lg font-semibold text-gray-900'>
                          {creatorUser.usr_firstName} {creatorUser.usr_lastName}
                        </p>
                        <p className='text-sm text-gray-600'>
                          @{creatorUser.usr_username} (
                          {doc_createdBy.emp_position})
                        </p>
                        <p className='text-sm text-gray-500'>
                          {creatorUser.usr_email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className='flex items-center justify-between border-t border-gray-200 pt-6'>
                  <Label
                    htmlFor='isPublic'
                    className='text-gray-700 font-semibold'
                  >
                    Chế độ truy cập
                  </Label>
                  <Switch
                    id='isPublic'
                    name='isPublic'
                    checked={isPublic}
                    onCheckedChange={(checked) => setIsPublic(checked)}
                    className='data-[state=checked]:bg-green-500'
                  />

                  <div className='w-28 flex items-center justify-end'>
                    <Badge
                      variant={isPublic ? 'default' : 'secondary'}
                      className={`ml-3 text-sm px-3 py-1 rounded-full ${isPublic ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}
                    >
                      {isPublic ? 'Công khai' : 'Hạn chế'}
                    </Badge>
                  </div>
                </div>

                <div className='border-t border-gray-200 pt-6'>
                  <h4 className='text-xl font-bold text-gray-800 mb-4 flex items-center'>
                    <span className='text-indigo-600 mr-2'>&#128274;</span> Danh
                    sách nhân viên được phép truy cập
                  </h4>

                  {isPublic ? (
                    <div className='mt-4 p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50'>
                      <p className='text-gray-600'>
                        Tài liệu này đang ở chế độ công khai. Tất cả nhân viên
                        trong hệ thống đều có thể truy cập tài liệu này.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {whiteList.map((employee) => (
                          <BriefEmployeeCard
                            key={employee.id}
                            employee={employee}
                            handleRemoveEmployee={handleRemoveEmployee}
                          />
                        ))}
                      </div>
                      <div className='mt-4 p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50'>
                        {!!selectedEmployees.length && (
                          <div className='flex items-center justify-between p-3 bg-blue-100 border border-blue-200 text-blue-800'>
                            <div className=''>
                              <span className='font-semibold text-sm'>{`Đã chọn ${selectedEmployees.length} Nhân sự để thêm`}</span>
                            </div>

                            <div className='flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => setSelectedItems([])} // Clear selection
                                className='text-blue-700 hover:bg-blue-200 flex items-center space-x-1'
                              >
                                <XCircle className='h-4 w-4' />
                                <span>Bỏ chọn tất cả</span>
                              </Button>

                              <Button
                                size='sm'
                                onClick={() => {
                                  handleWhileListEmployees(selectedEmployees);
                                  setSelectedItems([]);
                                }}
                                className='bg-blue-500 hover:bg-blue-400 flex items-center space-x-1'
                              >
                                <Plus className='h-4 w-4' />
                                <span>Thêm đã chọn</span>
                              </Button>
                            </div>
                          </div>
                        )}

                        <ItemList<IEmployee>
                          addNewHandler={() => {
                            navigate('/erp/employees/new');
                          }}
                          itemsPromise={employeesPromise}
                          name='Nhân viên'
                          visibleColumns={[
                            {
                              key: 'emp_user.usr_firstName',
                              title: 'Tên nhân viên',
                              sortField: 'emp_user.usr_firstName',
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
                              render: (item) => (
                                <Button
                                  variant='default'
                                  className='bg-blue-500 hover:bg-blue-400'
                                  onClick={() => {
                                    handleWhileListEmployees([item]);
                                  }}
                                >
                                  Thêm
                                </Button>
                              ),
                            },
                          ]}
                          selectedItems={selectedEmployees}
                          setSelectedItems={setSelectedItems}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className='sticky bottom-0 flex justify-end space-x-4 border-t border-gray-200 pt-6'>
                  <Button
                    variant='destructive'
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
                        navigate('/erp/documents');
                      }
                    }}
                  >
                    Xóa tài liệu
                  </Button>
                  <Button onClick={handleSave} variant='primary'>
                    Lưu thay đổi
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        }}
      </Defer>
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
