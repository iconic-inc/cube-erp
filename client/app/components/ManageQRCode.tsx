import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { QrCode, Clock, MapPin } from 'lucide-react';

export default function ManageQRCode({
  qrcode,
}: {
  qrcode?: { qrCode: string; attendanceUrl: string };
}) {
  return (
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-3 md:py-4'>
        <CardTitle className='text-white text-lg md:text-xl font-bold flex items-center'>
          <QrCode className='w-4 h-4 md:w-5 md:h-5 mr-2' />
          <span className='hidden sm:inline'>Mã QR chấm công</span>
          <span className='sm:hidden'>QR Code</span>
        </CardTitle>
      </CardHeader>

      <CardContent className='p-4 md:p-6 space-y-4 md:space-y-6'>
        {/* QR Code Display */}
        <div className='flex flex-col items-center space-y-3 md:space-y-4'>
          <div className='relative bg-white border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-3 md:p-4'>
            <img
              src={qrcode?.qrCode || '/images/qr-placeholder.png'}
              alt='QR Code chấm công'
              className='w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-cover rounded-lg'
            />
            {!qrcode?.qrCode && (
              <div className='absolute inset-0 flex items-center justify-center bg-gray-50 rounded-xl'>
                <div className='text-center text-gray-400'>
                  <QrCode className='w-8 h-8 md:w-12 md:h-12 mx-auto mb-2' />
                  <p className='text-xs md:text-sm'>Đang tải mã QR...</p>
                </div>
              </div>
            )}
          </div>

          {/* QR Code Info */}
          {/* <div className='text-center space-y-2'>
            <Badge variant='secondary' className='px-3 py-1'>
              <Clock className='w-3 h-3 mr-1' />
              Cập nhật hàng ngày
            </Badge>
            <p className='text-xs text-gray-500'>
              Quét mã QR để chấm công nhanh chóng
            </p>
          </div> */}
        </div>

        {/* Instructions */}
        {/* <div className='bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200'>
          <h4 className='font-medium text-red-900 mb-2 flex items-center'>
            <MapPin className='w-4 h-4 mr-2' />
            Hướng dẫn sử dụng
          </h4>
          <ul className='text-sm text-red-700 space-y-1'>
            <li>• Mở ứng dụng camera hoặc quét QR</li>
            <li>• Hướng camera vào mã QR phía trên</li>
            <li>• Thực hiện chấm công vào/ra</li>
            <li>• Đảm bảo kết nối mạng ổn định</li>
          </ul>
        </div> */}

        {qrcode?.attendanceUrl && (
          <div className='text-center'>
            <p className='text-xs text-gray-500 mb-2'>Link chấm công:</p>
            <Badge
              variant='outline'
              className='text-xs px-2 py-1 max-w-full break-all'
            >
              {qrcode.attendanceUrl}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
