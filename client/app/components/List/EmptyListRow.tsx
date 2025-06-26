import { Link } from '@remix-run/react';
import { Button } from '../ui/button';

export default function EmptyListRow({
  icon = 'person_off',
  title = 'Không có dữ liệu',
  description = 'Thêm dữ liệu đầu tiên của bạn để bắt đầu quản lý thông tin.',
  linkText = 'Thêm mới',
  addNewHandler,
  colSpan = 1,
}: {
  icon?: string;
  title: string;
  description: string;
  addNewHandler: () => void;
  linkText?: string;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className='py-12 flex flex-col items-center justify-center'>
          <div className='bg-gray-100 rounded-full p-6 mb-4'>
            <span className='material-symbols-outlined text-5xl text-gray-400'>
              {icon}
            </span>
          </div>
          <h3 className='text-xl font-medium text-gray-800 mb-2'>{title}</h3>
          <p className='text-gray-500 mb-6 text-center max-w-md'>
            {description}
          </p>

          <Button type='button' variant={'primary'} onClick={addNewHandler}>
            <span className='material-symbols-outlined text-sm'>add</span>
            {linkText}
          </Button>
        </div>
      </td>
    </tr>
  );
}
