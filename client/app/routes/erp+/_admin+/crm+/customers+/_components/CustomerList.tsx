import { Link, useSearchParams } from '@remix-run/react';
import Defer from '~/components/Defer';
import { ICustomer } from '~/interfaces/customer.interface';
import { IListResponse } from '~/interfaces/response.interface';
import CustomerPagination from './CustomerPagination';
import { IListColumn } from '~/interfaces/app.interface';
import { useState } from 'react';
import EmptyListRow from '~/components/EmptyListRow';

export default function CustomerList({
  customersPromise,
  selectedCustomers,
  setSelectedCustomers,
  visibleColumns,
}: {
  customersPromise: Promise<IListResponse<ICustomer>>;
  selectedCustomers: ICustomer[];
  setSelectedCustomers: (customers: ICustomer[]) => void;
  visibleColumns: IListColumn<ICustomer>[];
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const handleSelectAll = (customers: ICustomer[]) => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers);
    }
  };

  const handleCustomerSelect = (customer: ICustomer) => {
    if (selectedCustomers.some((item) => item.id === customer.id)) {
      setSelectedCustomers(
        selectedCustomers.filter((customer) => customer.id !== customer.id),
      );
    } else {
      setSelectedCustomers([...selectedCustomers, customer]);
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
              <Defer resolve={customersPromise}>
                {({ data }) => (
                  <input
                    type='checkbox'
                    checked={
                      selectedCustomers.length === data.length &&
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
            resolve={customersPromise}
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
              const { data: customers } = response;

              if (!customers || customers.length === 0) {
                // Empty State
                return (
                  <EmptyListRow
                    icon='person_off'
                    title='Không có Khách hàng nào'
                    description='Hãy thêm Khách hàng đầu tiên của bạn để bắt đầu quản lý thông tin.'
                    link='/erp/crm/customers/new'
                    linkText='Thêm mới Khách hàng'
                    colSpan={
                      visibleColumns.filter((col) => col.visible).length + 1
                    }
                  />
                );
              }

              return (
                <>
                  {/* Desktop view */}
                  {customers.map((customer) => (
                    <tr key={customer.id} className='hover:bg-gray-50'>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <input
                          type='checkbox'
                          checked={selectedCustomers.some(
                            (item) => item.id === customer.id,
                          )}
                          onChange={() => handleCustomerSelect(customer)}
                          className='rounded text-blue-500'
                        />
                      </td>

                      {visibleColumns
                        .filter((column) => column.visible)
                        .map((column) => (
                          <td key={column.key} className='px-4 py-4'>
                            {column.render(customer)}
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

      <Defer resolve={customersPromise}>
        {({ pagination }) => <CustomerPagination pagination={pagination} />}
      </Defer>
    </div>
  );
}
