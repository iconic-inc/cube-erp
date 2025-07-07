import { IListResponse } from '~/interfaces/response.interface';
import { Card } from '../ui/card';
import ListBulkActionBar from './ListBulkActionBar';
import { IListColumn, ILoaderDataPromise } from '~/interfaces/app.interface';
import ListToolbar from './ListToolbar';
import ListConfirmModal from './ListConfirmModal';
import ItemList from './ItemList';
import { useState } from 'react';

export default function List<T>({
  itemsPromise,
  visibleColumns,
  setVisibleColumns,
  name,
  addNewHandler,
  exportable = false,
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
  showToolbar?: boolean;
  showPagination?: boolean;
  deleteHandleRoute?: string;
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<T[]>([]);

  return (
    <Card>
      {/* Item Toolbar */}
      {showToolbar && (
        <ListToolbar
          name={name}
          exportable={exportable}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
        />
      )}

      {/* Bulk Action Bar (Visible when rows selected) */}
      {selectedItems.length > 0 && (
        <ListBulkActionBar
          name={name}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          handleConfirmBulkDelete={() => setShowDeleteModal(true)}
        />
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

      <ItemList<T>
        name={name}
        itemsPromise={itemsPromise}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        visibleColumns={visibleColumns}
        addNewHandler={addNewHandler}
        showPagination={showPagination}
      />
    </Card>
  );
}
