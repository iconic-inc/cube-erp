import { Card } from './ui/card';
import { LoaderCircle } from 'lucide-react';

export default function LoadingCard() {
  return (
    <Card className='p-4 bg-zinc-50 border border-zinc-300 rounded-lg shadow-sm m-4 text-center'>
      <div className='flex items-center justify-center mb-3'>
        <LoaderCircle className='h-8 w-8 animate-spin text-zinc-600' />
      </div>
      <h3 className='text-zinc-600 font-semibold'>Đang tải...</h3>
      <p className='text-zinc-700 my-1'>Vui lòng đợi trong giây lát.</p>
      <p className='text-sm text-gray-500'>
        Nếu quá trình tải mất quá nhiều thời gian, vui lòng làm mới trang hoặc
        thử lại sau.
      </p>
    </Card>
  );
}
