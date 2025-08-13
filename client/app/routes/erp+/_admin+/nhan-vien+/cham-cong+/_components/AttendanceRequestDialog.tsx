import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { AlertTriangle, Send, X } from 'lucide-react';

interface AttendanceRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
  isSubmitting?: boolean;
}

export default function AttendanceRequestDialog({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: AttendanceRequestDialogProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onConfirm(message.trim());
      setMessage('');
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md max-w-[95vw] mx-2'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-sm sm:text-base'>
            <AlertTriangle className='h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0' />
            <span className='hidden sm:inline'>IP không được phép</span>
            <span className='sm:hidden'>IP không hợp lệ</span>
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-3 sm:space-y-4'>
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4'>
            <p className='text-xs sm:text-sm text-amber-800'>
              <span className='hidden sm:inline'>
                Bạn đang thực hiện chấm công từ địa chỉ IP không được phép. Bạn
                có muốn tạo yêu cầu chấm công thay thế không?
              </span>
              <span className='sm:hidden'>
                IP không được phép. Tạo yêu cầu chấm công?
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-3 sm:space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='message' className='text-sm'>
                <span className='hidden sm:inline'>
                  Lý do yêu cầu chấm công *
                </span>
                <span className='sm:hidden'>Lý do *</span>
              </Label>
              <textarea
                id='message'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Nhập lý do cần chấm công từ vị trí này...`}
                className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                rows={3}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className='flex flex-col sm:flex-row items-center gap-2 sm:gap-3 pt-2'>
              <Button
                type='submit'
                disabled={!message.trim() || isSubmitting}
                className='flex items-center gap-2 w-full sm:w-auto text-sm'
              >
                <Send className='h-3 w-3 sm:h-4 sm:w-4' />
                {isSubmitting ? (
                  'Đang gửi...'
                ) : (
                  <>
                    <span className='hidden sm:inline'>Tạo yêu cầu</span>
                    <span className='sm:hidden'>Gửi</span>
                  </>
                )}
              </Button>

              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={isSubmitting}
                className='w-full sm:w-auto text-sm'
              >
                <X className='h-3 w-3 sm:h-4 sm:w-4 mr-2' />
                Hủy
              </Button>
            </div>
          </form>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3'>
            <p className='text-xs text-blue-700'>
              <span className='hidden sm:inline'>
                💡 Yêu cầu chấm công sẽ được gửi cho quản trị viên để xem xét và
                phê duyệt.
              </span>
              <span className='sm:hidden'>
                💡 Yêu cầu sẽ được gửi cho admin phê duyệt.
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
