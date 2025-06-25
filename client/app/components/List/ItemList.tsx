import { Link, useSearchParams } from '@remix-run/react';
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
  addNewHandler: () => void;
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
    <div className='overflow-x-auto'>
      <Table className='w-full'>
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
                          // Use the sortField defined in the column definition
                          const sortKey = column.sortField;
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
                // Empty State
                return (
                  <EmptyListRow
                    icon='person_off'
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

              return (
                <>
                  {/* Desktop view */}
                  {items.map((item, i) => (
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
                            className='max-w-[500px] overflow-hidden truncate'
                          >
                            {column.render(item)}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
                </>
              );
            }}
          </Defer>
        </TableBody>
      </Table>

      {showPagination && (
        <Defer resolve={itemsPromise}>
          {({ pagination }) => <ItemPagination pagination={pagination} />}
        </Defer>
      )}
    </div>
  );
}
