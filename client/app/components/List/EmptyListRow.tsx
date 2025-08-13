import { CircleOff, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { cloneElement, ReactElement } from 'react';

export default function EmptyListRow({
  icon = <CircleOff />,
  title = 'Không có dữ liệu',
  description = 'Thêm dữ liệu đầu tiên của bạn để bắt đầu quản lý thông tin.',
  linkText = 'Thêm mới',
  addNewHandler,
  colSpan = 1,
}: {
  icon?: ReactElement;
  title: string;
  description: string;
  addNewHandler?: () => void;
  linkText?: string;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className='py-12 flex flex-col items-center justify-center'>
          <div className='bg-gray-100 rounded-full p-6 mb-4'>
            {cloneElement(icon, { className: 'w-12 h-12 text-gray-400' })}
          </div>
          <h3 className='text-xl font-medium text-gray-800 mb-2'>{title}</h3>
          <p className='text-gray-500 mb-6 text-center max-w-md'>
            {description}
          </p>

          {addNewHandler && (
            <Button type='button' variant={'primary'} onClick={addNewHandler}>
              <Plus className='w-4 h-4 mr-2' />
              {linkText}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
