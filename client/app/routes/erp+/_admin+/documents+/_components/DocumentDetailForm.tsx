import { useState, useEffect, useRef } from 'react';
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
import { Switch } from '~/components/ui/switch';
import TextEditor from '~/components/TextEditor';
import BriefEmployeeCard from '~/components/BriefEmployeeCard';
import Defer from '~/components/Defer';
import LoadingCard from '~/components/LoadingCard';
import ErrorCard from '~/components/ErrorCard';
import { IDocument } from '~/interfaces/document.interface';
import { IEmployee, IEmployeeBrief } from '~/interfaces/employee.interface';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { formatDate } from '~/utils';
import { toast } from 'react-toastify';
import { Plus, Save, XCircle, User, FileText, Calendar } from 'lucide-react';

interface DocumentDetailFormProps {
  documentPromise: ILoaderDataPromise<IDocument>;
  employeesPromise: ILoaderDataPromise<{
    employees: IEmployee[];
    total: number;
    page: number;
    limit: number;
  }>;
  onSave: (formData: {
    name: string;
    type: string;
    description: string;
    isPublic: boolean;
    whiteList: IEmployeeBrief[];
  }) => Promise<void>;
}

export default function DocumentDetailForm({
  documentPromise,
  employeesPromise,
  onSave,
}: DocumentDetailFormProps) {
  return (
    <Defer resolve={documentPromise} fallback={<LoadingCard />}>
      {(document) => {
        if (!document || 'success' in document) {
          return (
            <ErrorCard
              message={
                document &&
                'message' in document &&
                typeof document.message === 'string'
                  ? document.message
                  : 'Đã xảy ra lỗi khi tải dữ liệu tài liệu'
              }
            />
          );
        }

        return (
          <DocumentFormContent
            document={document}
            employeesPromise={employeesPromise}
            onSave={onSave}
          />
        );
      }}
    </Defer>
  );
}

function DocumentFormContent({
  document,
  employeesPromise,
  onSave,
}: {
  document: IDocument;
  employeesPromise: ILoaderDataPromise<{
    employees: IEmployee[];
    total: number;
    page: number;
    limit: number;
  }>;
  onSave: (formData: {
    name: string;
    type: string;
    description: string;
    isPublic: boolean;
    whiteList: IEmployeeBrief[];
  }) => Promise<void>;
}) {
  const [name, setName] = useState(document.doc_name || '');
  const [description, setDescription] = useState(
    document.doc_description || '',
  );
  const [type, setType] = useState(document.doc_type || '');
  const [whiteList, setWhiteList] = useState(document.doc_whiteList || []);
  const [isPublic, setIsPublic] = useState(document.doc_isPublic || false);
  const [selectedEmployees, setSelectedEmployees] = useState<IEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { doc_createdBy } = document;
  const creatorUser = doc_createdBy?.emp_user;

  const handleRemoveEmployee = (employee: IEmployeeBrief) => {
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

  const handleWhiteListEmployees = (employees: IEmployee[]) => {
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
      setSelectedEmployees([]); // Clear selection after adding
    }
  };

  const handleSave = async () => {
    if (!name || !type) {
      alert('Vui lòng điền đầy đủ thông tin tên và loại tài liệu.');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        name,
        type,
        description,
        isPublic,
        whiteList,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-6 rounded-t-xl'>
        <div className='flex items-center space-x-4'>
          <div className='w-16 h-16 bg-white/20 rounded-full flex items-center justify-center'>
            <FileText className='w-8 h-8 text-white' />
          </div>
          <div className='flex-1'>
            <CardTitle className='text-white text-3xl font-bold'>
              {name || 'Chỉnh sửa tài liệu'}
            </CardTitle>
            <CardDescription className='text-purple-100 mt-2'>
              <span>ID: {document.id}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-6 space-y-6'>
        {/* Basic Information */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
              <FileText className='w-5 h-5 mr-2' />
              Thông tin cơ bản
            </h3>

            <div className='space-y-4'>
              <div>
                <Label
                  htmlFor='name'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Tên tài liệu
                </Label>
                <Input
                  id='name'
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                  placeholder='Nhập tên tài liệu'
                />
              </div>

              {/* <div>
                <Label
                  htmlFor='type'
                  className='text-gray-700 font-semibold mb-2 block'
                >
                  Loại tài liệu
                </Label>
                <Input
                  id='type'
                  type='text'
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                  placeholder='Nhập loại tài liệu'
                />
              </div> */}

              <div className='flex items-center space-x-3'>
                <Switch
                  id='isPublic'
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label
                  htmlFor='isPublic'
                  className='text-gray-700 font-semibold cursor-pointer'
                >
                  Công khai cho tất cả nhân viên
                </Label>
              </div>
            </div>
          </div>

          {/* Document Metadata */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
              <User className='w-5 h-5 mr-2' />
              Thông tin người tạo
            </h3>

            {creatorUser && (
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <div className='flex items-center space-x-3'>
                  <div className='w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center'>
                    {creatorUser.usr_avatar?.img_url ? (
                      <img
                        src={creatorUser.usr_avatar.img_url}
                        alt={`${creatorUser.usr_firstName} ${creatorUser.usr_lastName}`}
                        className='w-10 h-10 rounded-full object-cover'
                      />
                    ) : (
                      <User className='w-6 h-6 text-gray-500' />
                    )}
                  </div>
                  <div>
                    <p className='font-medium text-gray-900'>
                      {creatorUser.usr_firstName} {creatorUser.usr_lastName}
                    </p>
                    <p className='text-sm text-gray-500'>
                      {creatorUser.usr_email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className='space-y-3'>
              <div className='flex items-center space-x-3'>
                <Calendar className='w-4 h-4 text-gray-400' />
                <span className='text-sm text-gray-500'>Ngày tạo:</span>
                <span className='text-sm font-medium'>
                  {document.createdAt
                    ? formatDate(document.createdAt)
                    : 'Không có thông tin'}
                </span>
              </div>

              <div className='flex items-center space-x-3'>
                <Calendar className='w-4 h-4 text-gray-400' />
                <span className='text-sm text-gray-500'>Cập nhật lúc:</span>
                <span className='text-sm font-medium'>
                  {document.updatedAt
                    ? formatDate(document.updatedAt)
                    : 'Không có thông tin'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className='space-y-3'>
          <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
            <FileText className='w-5 h-5 mr-2' />
            Mô tả tài liệu
          </h3>

          <TextEditor
            value={description}
            name='description'
            onChange={setDescription}
            placeholder='Nhập mô tả tài liệu...'
          />
        </div>

        {/* Access Control */}
        {!isPublic && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
              <User className='w-5 h-5 mr-2' />
              Quyền truy cập
            </h3>

            {/* Current whitelist */}
            {whiteList && whiteList.length > 0 && (
              <div className='space-y-3'>
                <h4 className='text-md font-medium text-gray-700'>
                  Nhân viên có quyền truy cập ({whiteList.length})
                </h4>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {whiteList.map((employee) => (
                    <div key={employee.id} className='relative'>
                      <BriefEmployeeCard employee={employee} />
                      {employee.id !== document.doc_createdBy?.id && (
                        <Button
                          size='sm'
                          variant='destructive'
                          className='absolute -top-2 -right-2 w-6 h-6 rounded-full p-0'
                          onClick={() => handleRemoveEmployee(employee)}
                        >
                          <XCircle className='w-4 h-4' />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add employees */}
            <div className='space-y-3'>
              <h4 className='text-md font-medium text-gray-700'>
                Thêm nhân viên vào danh sách truy cập
              </h4>
              <Defer resolve={employeesPromise} fallback={<LoadingCard />}>
                {(employeesData) => {
                  if (!employeesData || 'success' in employeesData) {
                    return (
                      <ErrorCard
                        message={
                          employeesData &&
                          'message' in employeesData &&
                          typeof employeesData.message === 'string'
                            ? employeesData.message
                            : 'Đã xảy ra lỗi khi tải danh sách nhân viên'
                        }
                      />
                    );
                  }

                  return (
                    <div className='space-y-3'>
                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto'>
                        {employeesData.employees.map((employee) => {
                          const isSelected = selectedEmployees.some(
                            (selected) => selected.id === employee.id,
                          );
                          const isAlreadyInWhitelist = whiteList.some(
                            (whitelisted) => whitelisted.id === employee.id,
                          );

                          if (isAlreadyInWhitelist) {
                            return null; // Don't show employees already in whitelist
                          }

                          return (
                            <div
                              key={employee.id}
                              className={`cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? 'ring-2 ring-blue-500 scale-105'
                                  : 'hover:scale-102'
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedEmployees((prev) =>
                                    prev.filter(
                                      (emp) => emp.id !== employee.id,
                                    ),
                                  );
                                } else {
                                  setSelectedEmployees((prev) => [
                                    ...prev,
                                    employee,
                                  ]);
                                }
                              }}
                            >
                              <BriefEmployeeCard employee={employee} />
                            </div>
                          );
                        })}
                      </div>

                      {selectedEmployees.length > 0 && (
                        <Button
                          onClick={() =>
                            handleWhiteListEmployees(selectedEmployees)
                          }
                          className='w-full bg-green-600 hover:bg-green-700 text-white'
                        >
                          <Plus className='w-4 h-4' />
                          Thêm {selectedEmployees.length} nhân viên được chọn
                        </Button>
                      )}
                    </div>
                  );
                }}
              </Defer>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className='flex justify-end space-x-3 pt-4 border-t border-gray-200'>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className='bg-purple-600 hover:bg-purple-700 text-white'
          >
            <Save className='w-4 h-4 mr-2' />
            {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
