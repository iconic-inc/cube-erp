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
    <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-blue-100 border border-blue-200 text-blue-800 gap-2'>
      <div className='flex-shrink-0'>
        <span className='font-semibold text-sm'>{`Đã chọn ${selectedItems.length} ${name}`}</span>
      </div>

      <div className='flex items-center gap-2 w-full sm:w-auto'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setSelectedItems([])}
          className='text-blue-700 hover:bg-blue-200 flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 flex-1 sm:flex-initial justify-center'
        >
          <XCircle className='h-3 w-3 sm:h-4 sm:w-4' />
          <span className='hidden sm:inline'>Bỏ chọn tất cả</span>
          <span className='sm:hidden'>Bỏ chọn</span>
        </Button>

        <Button
          variant='destructive'
          size='sm'
          onClick={handleConfirmBulkDelete}
          className='hover:bg-red-400 flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 flex-1 sm:flex-initial justify-center'
        >
          <Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
          <span className='hidden sm:inline'>Xóa đã chọn</span>
          <span className='sm:hidden'>Xóa</span>
        </Button>
      </div>
    </div>
  );
}
