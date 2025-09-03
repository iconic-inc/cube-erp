import { IDocumentFolder } from '~/interfaces/documentFolder.interface';
import { IListResponse } from '../interfaces/response.interface';
import { IListColumn } from '~/interfaces/app.interface';
import { useState } from 'react';
import { Link, useFetcher } from '@remix-run/react';
import List from './List';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { action } from '~/routes/api+/folders+/$id';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';
import { Folder } from 'lucide-react';

export default function DocumentFolderList({
  foldersPromise,
  addNewHandler,
}: {
  foldersPromise: Promise<IListResponse<IDocumentFolder>>;
  addNewHandler: () => any;
}) {
  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<IDocumentFolder>[]
  >([
    {
      key: 'fol_name',
      title: 'Tên thư mục',
      visible: true,
      sortField: 'fol_name',
      render: (item: IDocumentFolder) => (
        <Link
          prefetch='intent'
          to={`/erp/documents?parent=${item.id}`}
          className='text-blue-600 hover:underline text-sm sm:text-base flex gap-2 truncate max-w-[200px] sm:max-w-none'
          title={item.fol_name}
        >
          <Folder />
          {item.fol_name}
        </Link>
      ),
    },
    {
      key: 'fol_owner',
      title: 'Người tạo',
      visible: true,
      sortField: 'fol_owner.emp_firstName',
      render: (item: IDocumentFolder) => (
        <Link
          prefetch='intent'
          to={`/erp/documents?owner=${item.fol_owner.id}`}
          className='text-blue-600 hover:underline text-sm sm:text-base block truncate max-w-[200px] sm:max-w-none'
          title={`Người tạo: ${item.fol_owner.emp_user?.usr_firstName}`}
        >
          {`${item.fol_owner.emp_user?.usr_firstName} ${item.fol_owner.emp_user?.usr_lastName}`}
        </Link>
      ),
    },
    {
      key: 'action',
      title: 'Hành động',
      visible: true,
      render: (item: IDocumentFolder) => (
        <div className='flex items-center space-x-2'>
          <Button variant={'destructive'} onClick={() => setDeletingItem(item)}>
            Xóa
          </Button>
          <Button onClick={() => setItem(item)}>Chỉnh sửa</Button>
        </div>
      ),
    },
  ]);

  const [item, setItem] = useState<IDocumentFolder | null>(null);
  const [deletingItem, setDeletingItem] = useState<IDocumentFolder | null>(
    null,
  );
  const fetcher = useFetcher<typeof action>();
  useFetcherResponseHandler(fetcher, {
    onSuccess: () => {
      setItem(null);
      setDeletingItem(null);
    },
  });

  const handleDelete = (item: IDocumentFolder) => {
    fetcher.submit(
      { id: item.id },
      { method: 'DELETE', action: `/api/folders/${item.id}` },
    );
  };

  const formId = 'update-folder-form';

  return (
    <>
      <List<IDocumentFolder>
        showToolbar={false}
        showPagination={false}
        itemsPromise={foldersPromise}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        addNewHandler={addNewHandler}
        name='Thư mục'
        deleteHandleRoute='/api/folders/bulk'
      />

      <AlertDialog open={!!item || !!deletingItem}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {item && <AlertDialogTitle>Cập nhật thư mục</AlertDialogTitle>}
            {deletingItem && <AlertDialogTitle>Xóa thư mục</AlertDialogTitle>}
            {deletingItem && (
              <AlertDialogDescription>
                {`Bạn có chắc chắn muốn xóa thư mục "${deletingItem.fol_name}"?`}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>

          {item && (
            <fetcher.Form
              id={formId}
              method='PUT'
              action={`/api/folders/${item?.id}`}
            >
              <Label htmlFor='folderName'>Tên thư mục</Label>
              <Input
                id='folderName'
                type='text'
                name='name'
                defaultValue={item?.fol_name}
                placeholder='Tên thư mục'
                required
              />
            </fetcher.Form>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setItem(null);
                setDeletingItem(null);
              }}
            >
              Huỷ
            </AlertDialogCancel>
            {item && (
              <AlertDialogAction type='submit' form={formId}>
                Cập nhật
              </AlertDialogAction>
            )}
            {deletingItem && (
              <AlertDialogAction
                type='button'
                variant={'destructive'}
                onClick={() => handleDelete(deletingItem)}
              >
                Xóa
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
