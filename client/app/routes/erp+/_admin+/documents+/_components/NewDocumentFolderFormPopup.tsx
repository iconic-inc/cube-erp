import { useFetcher } from '@remix-run/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';
import { action } from '~/routes/api+/folders+';

export function NewDocumentFolderFormPopup({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const fetcher = useFetcher<typeof action>();
  useFetcherResponseHandler(fetcher, {
    onSuccess: () => {
      setOpen(false);
    },
  });
  const formId = `new-folder-form`;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tạo thư mục mới</AlertDialogTitle>
        </AlertDialogHeader>

        <fetcher.Form id={formId} method='POST' action='/api/folders'>
          <Label htmlFor='folderName'>Tên thư mục</Label>
          <Input
            id='folderName'
            type='text'
            name='name'
            placeholder='Tên thư mục'
            required
          />
        </fetcher.Form>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)}>
            Huỷ
          </AlertDialogCancel>
          <AlertDialogAction type='submit' form={formId}>
            Tạo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
