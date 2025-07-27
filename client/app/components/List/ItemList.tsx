import { Link, useSearchParams } from '@remix-run/react';
import { ChevronUp, ChevronDown, FileSpreadsheet } from 'lucide-react';
import Defer from '~/components/Defer';
import { IListResponse } from '~/interfaces/response.interface';
import ItemPagination from './ListPagination';
import { IListColumn, ILoaderDataPromise } from '~/interfaces/app.interface';
import EmptyListRow from '~/components/List/EmptyListRow';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import ErrorCard from '../ErrorCard';
import LoadingCard from '../LoadingCard';

export default function ItemList<T>({
  name,
  itemsPromise,
  selectedItems,
  setSelectedItems,
  visibleColumns,
  addNewHandler,
  showPagination = true,
}: {
  name: string;
  itemsPromise: ILoaderDataPromise<IListResponse<T>>;
  selectedItems: T[];
  setSelectedItems: (items: T[]) => void;
  visibleColumns: IListColumn<T>[];
  addNewHandler?: () => void;
  showPagination?: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const handleSelectAll = (items: T[]) => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items);
    }
  };

  const handleItemSelect = (item: T) => {
    if (
      selectedItems.some((selected: any) => selected.id === (item as any).id)
    ) {
      setSelectedItems(
        selectedItems.filter(
          (selected: any) => selected.id !== (item as any).id,
        ),
      );
    } else {
      setSelectedItems([...selectedItems, item]);
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
    <div className='w-full'>
      {/* Desktop Table View */}
      <div className='hidden md:block overflow-x-auto'>
        <Table className='w-full min-w-[600px]'>
          <TableHeader className='bg-gray-50'>
            <TableRow>
              <Defer
                resolve={itemsPromise}
                fallback={
                  <TableHead colSpan={visibleColumns.length + 1}>
                    <LoadingCard />
                  </TableHead>
                }
                errorElement={(error) => (
                  <TableHead colSpan={visibleColumns.length + 1}>
                    <ErrorCard message={error.message} />
                  </TableHead>
                )}
              >
                {({ data }) => (
                  <>
                    <TableHead className='w-[50px] text-center'>
                      {!!data.length && (
                        <Checkbox
                          checked={
                            selectedItems.length === data.length &&
                            data.length > 0
                          }
                          onCheckedChange={() => handleSelectAll(data)}
                          className='rounded h-4 w-4'
                        />
                      )}
                    </TableHead>
                    {visibleColumns
                      .filter((column) => column.visible)
                      .map((column) => (
                        <TableHead
                          key={column.key as string}
                          className={`min-w-fit text-left whitespace-nowrap text-gray-600 font-semibold py-4 ${column.sortField ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                          onClick={() => {
                            if (!column.sortField) return;
                            const sortKey = column.sortField;
                            handleSortChange(sortKey as string);
                          }}
                        >
                          <div className='flex items-center justify-between'>
                            <span className='text-sm'>{column.title}</span>
                            <span className='w-4 h-4 inline-flex justify-center'>
                              {sortBy === (column.sortField || column.key) && (
                                <>
                                  {sortOrder === 'asc' ? (
                                    <ChevronUp className='w-3 h-3' />
                                  ) : (
                                    <ChevronDown className='w-3 h-3' />
                                  )}
                                </>
                              )}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                  </>
                )}
              </Defer>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Defer
              resolve={itemsPromise}
              fallback={
                <TableRow>
                  <TableCell
                    colSpan={
                      visibleColumns.filter((col) => col.visible).length + 1
                    }
                  >
                    <LoadingCard />
                  </TableCell>
                </TableRow>
              }
              errorElement={(error) => (
                <TableRow>
                  <TableCell
                    colSpan={
                      visibleColumns.filter((col) => col.visible).length + 1
                    }
                  >
                    <ErrorCard message={error.message} />
                  </TableCell>
                </TableRow>
              )}
            >
              {(response) => {
                const { data: items } = response;

                if (!items || items.length === 0) {
                  return (
                    <EmptyListRow
                      title={`Không có ${name} nào`}
                      description={`Hãy thêm ${name} đầu tiên của bạn để bắt đầu quản lý thông tin.`}
                      addNewHandler={addNewHandler}
                      linkText={`Thêm mới ${name}`}
                      colSpan={
                        visibleColumns.filter((col) => col.visible).length + 1
                      }
                    />
                  );
                }

                return items.map((item, i) => (
                  <TableRow
                    key={i}
                    className={`border-b border-gray-100 transition-colors duration-150 ease-in-out ${selectedItems.some((selected: any) => selected.id === (item as any).id) ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
                  >
                    <TableCell className='text-center py-3'>
                      <Checkbox
                        checked={selectedItems.some(
                          (selected: any) => selected.id === (item as any).id,
                        )}
                        onCheckedChange={() => handleItemSelect(item)}
                        className='rounded h-4 w-4'
                      />
                    </TableCell>

                    {visibleColumns
                      .filter((column) => column.visible)
                      .map((column) => (
                        <TableCell
                          key={column.key}
                          className='max-w-[200px] lg:max-w-[250px] overflow-hidden text-sm'
                        >
                          <div className='truncate'>{column.render(item)}</div>
                        </TableCell>
                      ))}
                  </TableRow>
                ));
              }}
            </Defer>
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className='md:hidden space-y-4 p-4'>
        <Defer
          resolve={itemsPromise}
          fallback={<LoadingCard />}
          errorElement={(error) => <ErrorCard message={error.message} />}
        >
          {(response) => {
            const { data: items } = response;

            if (!items || items.length === 0) {
              return (
                <div className='text-center py-12'>
                  <FileSpreadsheet className='w-16 h-16 text-gray-300 mb-4 mx-auto' />
                  <h3 className='text-xl font-medium text-gray-900 mb-2'>
                    Không có {name} nào
                  </h3>
                  <p className='text-gray-500 mb-6 text-base px-4'>
                    Hãy thêm {name} đầu tiên của bạn để bắt đầu quản lý thông
                    tin.
                  </p>
                  {addNewHandler && (
                    <button
                      onClick={addNewHandler}
                      className='px-6 py-3 bg-blue-600 text-white rounded-lg text-base font-medium hover:bg-blue-700 transition shadow-sm'
                    >
                      Thêm mới {name}
                    </button>
                  )}
                </div>
              );
            }

            return items.map((item, i) => (
              <div
                key={i}
                className={`relative border rounded-xl p-4 transition-all duration-200 ${
                  selectedItems.some(
                    (selected: any) => selected.id === (item as any).id,
                  )
                    ? 'bg-blue-50 border-blue-200 shadow-md'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                {/* Selection Checkbox */}
                <div className='absolute top-3 right-3'>
                  <Checkbox
                    checked={selectedItems.some(
                      (selected: any) => selected.id === (item as any).id,
                    )}
                    onCheckedChange={() => handleItemSelect(item)}
                    className='rounded h-5 w-5'
                  />
                </div>

                {/* Item Content */}
                <div className='pr-8 space-y-3'>
                  {/* Primary Information (First Column) */}
                  {visibleColumns.filter((column) => column.visible)[0] && (
                    <div className='mb-4'>
                      {visibleColumns
                        .filter((column) => column.visible)[0]
                        .render(item)}
                    </div>
                  )}

                  {/* Secondary Information */}
                  <div className='grid grid-cols-1 gap-3'>
                    {visibleColumns
                      .filter((column) => column.visible)
                      .slice(1, 5) // Show columns 2-5 on mobile
                      .map((column) => (
                        <div
                          key={column.key}
                          className='flex flex-col space-y-1'
                        >
                          <span className='text-xs font-medium text-gray-400 uppercase tracking-wider'>
                            {column.title}
                          </span>
                          <div className='text-base text-gray-900'>
                            {column.render(item)}
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Additional Info Indicator */}
                  {visibleColumns.filter((column) => column.visible).length >
                    5 && (
                    <div className='pt-2 border-t border-gray-100'>
                      <span className='text-sm text-gray-500'>
                        +
                        {visibleColumns.filter((column) => column.visible)
                          .length - 5}{' '}
                        thông tin khác
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ));
          }}
        </Defer>
      </div>

      {showPagination && (
        <div className='mt-4'>
          <Defer resolve={itemsPromise}>
            {({ pagination }) => <ItemPagination pagination={pagination} />}
          </Defer>
        </div>
      )}
    </div>
  );
}
