import { IListResponse } from '~/interfaces/response.interface';
import { Card } from '../ui/card';
import ListBulkActionBar from './ListBulkActionBar';
import { IListColumn, ILoaderDataPromise } from '~/interfaces/app.interface';
import ListToolbar from './ListToolbar';
import ListConfirmModal from './ListConfirmModal';
import ItemList from './ItemList';
import { useState } from 'react';
import Defer from '../Defer';

export default function List<T>({
  itemsPromise,
  visibleColumns,
  setVisibleColumns,
  name,
  addNewHandler,
  exportable = false,
  importable = false,
  showToolbar = true,
  showPagination = true,
  deleteHandleRoute,
}: {
  itemsPromise: ILoaderDataPromise<IListResponse<T>>;
  visibleColumns: IListColumn<T>[];
  setVisibleColumns: (columns: IListColumn<T>[]) => void;
  name: string;
  addNewHandler?: () => void;
  exportable?: boolean;
  importable?: boolean;
  showToolbar?: boolean;
  showPagination?: boolean;
  deleteHandleRoute?: string;
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<T[]>([]);

  return (
    <Card className='overflow-hidden'>
      {/* Item Toolbar */}
      {showToolbar && (
        <div className='border-b border-gray-200'>
          <Defer resolve={itemsPromise}>
            {(items) => {
              return (
                <ListToolbar<T>
                  name={name}
                  exportable={exportable}
                  importable={importable}
                  visibleColumns={visibleColumns}
                  setVisibleColumns={setVisibleColumns}
                  items={items}
                />
              );
            }}
          </Defer>
        </div>
      )}

      {/* Bulk Action Bar (Visible when rows selected) */}
      {selectedItems.length > 0 && (
        <div className='border-b border-gray-200 bg-blue-50'>
          <ListBulkActionBar
            name={name}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            handleConfirmBulkDelete={() => setShowDeleteModal(true)}
          />
        </div>
      )}

      {showDeleteModal && selectedItems.length && (
        <ListConfirmModal
          name={name}
          setShowDeleteModal={setShowDeleteModal}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          deleteHandleRoute={deleteHandleRoute}
        />
      )}

      <div className='overflow-x-auto'>
        <ItemList<T>
          name={name}
          itemsPromise={itemsPromise}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          visibleColumns={visibleColumns}
          addNewHandler={addNewHandler}
          showPagination={showPagination}
        />
      </div>
    </Card>
  );
}
