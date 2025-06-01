import { Link, useSearchParams } from '@remix-run/react';
import Defer from '~/components/Defer';
import { IEmployee } from '~/interfaces/employee.interface';
import { IListResponse } from '~/interfaces/response.interface';
import EmployeePagination from './EmployeePagination';
import { IListColumn } from '~/interfaces/app.interface';
import { useState } from 'react';
import EmptyListRow from '~/components/EmptyListRow';

export default function EmployeeList({
  employeesPromise,
  selectedEmployees,
  setSelectedEmployees,
  visibleColumns,
}: {
  employeesPromise: Promise<IListResponse<IEmployee>>;
  selectedEmployees: IEmployee[];
  setSelectedEmployees: (employees: IEmployee[]) => void;
  visibleColumns: IListColumn<IEmployee>[];
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const handleSelectAll = (employees: IEmployee[]) => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees);
    }
  };

  const handleEmployeeSelect = (employee: IEmployee) => {
    if (selectedEmployees.some((item) => item.id === employee.id)) {
      setSelectedEmployees(
        selectedEmployees.filter((employee) => employee.id !== employee.id),
      );
    } else {
      setSelectedEmployees([...selectedEmployees, employee]);
    }
  };

  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      searchParams.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      searchParams.set('sortBy', column);
      searchParams.set('sortOrder', 'desc');
    }
    setSearchParams(searchParams);
  };

  return (
    <div className='hidden md:block overflow-x-auto'>
      <table className='w-full'>
        <thead className='bg-gray-50'>
          <tr>
            <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              <Defer resolve={employeesPromise}>
                {({ data }) => (
                  <input
                    type='checkbox'
                    checked={
                      selectedEmployees.length === data.length &&
                      data.length > 0
                    }
                    onChange={() => handleSelectAll(data)}
                    className='rounded text-blue-500'
                  />
                )}
              </Defer>
            </th>
            {visibleColumns
              .filter((column) => column.visible)
              .map((column) => (
                <th
                  key={column.key as string}
                  className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                  onClick={() => {
                    // Use the sortField defined in the column definition
                    const sortKey = column.sortField || column.key;
                    handleSortChange(sortKey as string);
                  }}
                >
                  <div className='flex items-center justify-between'>
                    <span>{column.title}</span>
                    <span className='w-4 h-4 inline-flex justify-center'>
                      {/* Check if this column is currently being sorted by */}
                      {sortBy === (column.sortField || column.key) && (
                        <span className='material-symbols-outlined text-xs'>
                          {sortOrder === 'asc'
                            ? 'arrow_upward'
                            : 'arrow_downward'}
                        </span>
                      )}
                    </span>
                  </div>
                </th>
              ))}
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          <Defer
            resolve={employeesPromise}
            fallback={
              <tr>
                <td
                  colSpan={
                    visibleColumns.filter((col) => col.visible).length + 1
                  }
                  className='text-center py-4'
                >
                  Loading...
                </td>
              </tr>
            }
          >
            {(response) => {
              const { data: employees } = response;

              if (!employees || employees.length === 0) {
                // Empty State
                return (
                  <EmptyListRow
                    icon='person_off'
                    title='Không có nhân viên nào'
                    description='Hãy thêm nhân viên đầu tiên của bạn để bắt đầu quản lý thông tin.'
                    link='/erp/employees/new'
                    linkText='Thêm mới nhân viên'
                    colSpan={
                      visibleColumns.filter((col) => col.visible).length + 1
                    }
                  />
                );
              }

              return (
                <>
                  {/* Desktop view */}
                  {employees.map((employee) => (
                    <tr key={employee.id} className='hover:bg-gray-50'>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <input
                          type='checkbox'
                          checked={selectedEmployees.some(
                            (item) => item.id === employee.id,
                          )}
                          onChange={() => handleEmployeeSelect(employee)}
                          className='rounded text-blue-500'
                        />
                      </td>

                      {visibleColumns
                        .filter((column) => column.visible)
                        .map((column) => (
                          <td key={column.key} className='px-4 py-4'>
                            {column.render(employee)}
                          </td>
                        ))}
                    </tr>
                  ))}
                </>
              );
            }}
          </Defer>
        </tbody>
      </table>

      <Defer resolve={employeesPromise}>
        {({ pagination }) => <EmployeePagination pagination={pagination} />}
      </Defer>
    </div>
  );
}
