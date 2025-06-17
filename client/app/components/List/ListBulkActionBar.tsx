import { Trash2, XCircle } from 'lucide-react';
import { Button } from '../ui/button';

export default function ListBulkActionBar({
  name,
  selectedItems,
  setSelectedItems,
  handleConfirmBulkDelete,
}: {
  name: string;
  selectedItems: Array<any>;
  setSelectedItems: (items: any[]) => void;
  handleConfirmBulkDelete: () => void;
}) {
  return (
    <div className='flex items-center justify-between p-3 bg-blue-100 border border-blue-200 text-blue-800'>
      <div className=''>
        <span className='font-semibold text-sm'>{`Đã chọn ${selectedItems.length} ${name} để xóa`}</span>
      </div>

      <div className='flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setSelectedItems([])} // Clear selection
          className='text-blue-700 hover:bg-blue-200 flex items-center space-x-1'
        >
          <XCircle className='h-4 w-4' />
          <span>Bỏ chọn tất cả</span>
        </Button>

        <Button
          variant='destructive'
          size='sm'
          onClick={handleConfirmBulkDelete}
          className='hover:bg-red-400 flex items-center space-x-1'
        >
          <Trash2 className='h-4 w-4' />
          <span>Xóa đã chọn</span>
        </Button>
      </div>
    </div>
  );
}
