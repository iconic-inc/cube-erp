import { Card, CardHeader } from './ui/card';

export default function ErrorCard({ message }: { message: string }) {
  return (
    <Card className='p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm m-4 text-center'>
      <h3 className='text-red-600 font-semibold'>Error</h3>
      <p className='text-red-700 my-1'>{message}</p>
      <p className='text-sm text-gray-500'>
        Vui lòng thử lại sau hoặc liên hệ với bộ phận hỗ trợ nếu vấn đề vẫn tiếp
        diễn.
      </p>
    </Card>
  );
}
