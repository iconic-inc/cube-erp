import { Link } from '@remix-run/react';
import { useEffect, useState } from 'react';
import List from '~/components/List';
import { Badge } from '~/components/ui/badge';
import { IListColumn } from '~/interfaces/app.interface';
import { IDocument } from '~/interfaces/document.interface';
import { IEmployee } from '~/interfaces/employee.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { isResolveError } from '~/lib';

export default function DocumentList({
  documentsPromise,
  employeesPromise,
  addNewHandler,
}: {
  documentsPromise: Promise<IListResponse<IDocument>>;
  employeesPromise: Promise<IListResponse<IEmployee>>;
  addNewHandler: () => void;
}) {
  useEffect(() => {
    const loadEmployees = async () => {
      const employeesData = await employeesPromise;
      if (isResolveError(employeesData)) {
        console.error('Error loading employees:', employeesData.message);
        return;
      }
      setVisibleColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (col.key === 'doc_createdBy') {
            return {
              ...col,
              options: employeesData.data.length
                ? employeesData.data.map((emp) => ({
                    value: emp.id,
                    label: `${emp.emp_user?.usr_firstName} ${emp.emp_user?.usr_lastName}`,
                  }))
                : [
                    {
                      value: '',
                      label: 'Không có nhân viên',
                    },
                  ],
            };
          }
          return col;
        }),
      ); // Trigger re-render to update options
    };
    loadEmployees();
  }, [employeesPromise]);

  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<IDocument>[]
  >([
    {
      key: 'doc_name',
      title: 'Tên tài liệu',
      visible: true,
      sortField: 'doc_name',
      render: (item: IDocument) => (
        <Link
          prefetch='intent'
          to={`/erp/documents/${item.id}`}
          className='text-blue-600 hover:underline text-sm sm:text-base block truncate max-w-[200px] sm:max-w-none'
          title={item.doc_name}
        >
          {item.doc_name}
        </Link>
      ),
    },
    {
      key: 'doc_url',
      title: 'Đường dẫn',
      visible: true,
      sortField: 'doc_url',
      render: (item: IDocument) => (
        <a
          href={item.doc_url}
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-600 hover:underline text-sm sm:text-base block truncate max-w-[100px] sm:max-w-none'
          title={item.doc_url}
        >
          <span className='hidden sm:inline'>{item.doc_url}</span>
          <span className='sm:hidden'>Xem</span>
        </a>
      ),
    },
    {
      key: 'doc_createdBy',
      title: 'Người tạo',
      visible: true,
      sortField: 'doc_createdBy',
      filterField: 'createdBy',
      options: [],
      render: (item: IDocument) => {
        if (typeof item.doc_createdBy === 'string') {
          return (
            <span className='text-sm sm:text-base'>{item.doc_createdBy}</span>
          );
        }
        return (
          <Link
            prefetch='intent'
            to={`/erp/employees/${item.doc_createdBy.id}`}
            className='text-blue-600 hover:underline text-sm sm:text-base block truncate max-w-[100px] sm:max-w-none'
            title={`${item.doc_createdBy.emp_user.usr_firstName} ${item.doc_createdBy.emp_user.usr_lastName}`}
          >
            <span className='hidden sm:inline'>
              {item.doc_createdBy.emp_user.usr_firstName}{' '}
              {item.doc_createdBy.emp_user.usr_lastName}
            </span>
            <span className='sm:hidden'>
              {item.doc_createdBy.emp_user.usr_firstName}
            </span>
          </Link>
        );
      },
    },
    {
      key: 'doc_isPublic',
      title: 'Chế độ try cập',
      visible: true,
      filterField: 'isPublic',
      options: [
        { value: 'true', label: 'Công khai' },
        { value: 'false', label: 'Hạn chế' },
      ],
      render: (item: IDocument) => {
        if (typeof item.doc_whiteList === 'string') {
          return (
            <span className='text-sm sm:text-base'>{item.doc_whiteList}</span>
          );
        }
        return (
          <Badge
            variant={item.doc_isPublic ? 'default' : 'secondary'}
            className={`${item.doc_isPublic ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'} hover:bg-unset text-xs`}
          >
            <span className='sm:inline'>
              {item.doc_isPublic ? 'Công khai' : 'Hạn chế'}
            </span>
          </Badge>
        );
      },
    },
  ]);

  return (
    <List<IDocument>
      itemsPromise={documentsPromise}
      visibleColumns={visibleColumns}
      setVisibleColumns={setVisibleColumns}
      addNewHandler={addNewHandler}
      name='Tài liệu'
    />
  );
}
