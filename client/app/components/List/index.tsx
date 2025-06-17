import { IListResponse } from '~/interfaces/response.interface';
import { Card } from '../ui/card';
import ListBulkActionBar from './ListBulkActionBar';
import { IListColumn } from '~/interfaces/app.interface';
import ListToolbar from './ListToolbar';
import ListConfirmModal from './ListConfirmModal';
import ItemList from './ItemList';

export default function List<T>({
  itemsPromise,
  selectedItems,
  setSelectedItems,
  visibleColumns,
  setVisibleColumns,
  setShowDeleteModal,
  showDeleteModal,
  name,
  addNewHandler,
}: {
  itemsPromise: Promise<IListResponse<T>>;
  selectedItems: Array<T>;
  setSelectedItems: (items: T[]) => void;
  visibleColumns: IListColumn<T>[];
  setVisibleColumns: (columns: IListColumn<T>[]) => void;
  setShowDeleteModal: (show: boolean) => void;
  showDeleteModal: boolean;
  name: string;
  addNewHandler: () => void;
}) {
  return (
    <Card>
      {/* Item Toolbar */}
      <ListToolbar
        name={name}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
      />

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
        />
      )}

      <ItemList<T>
        name={name}
        itemsPromise={itemsPromise}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        visibleColumns={visibleColumns}
        addNewHandler={addNewHandler}
      />
    </Card>
  );
}
