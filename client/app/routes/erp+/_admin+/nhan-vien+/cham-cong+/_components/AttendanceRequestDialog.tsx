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
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-amber-500' />
            IP không được phép
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
            <p className='text-sm text-amber-800'>
              Bạn đang thực hiện chấm công từ địa chỉ IP không được phép. Bạn có
              muốn tạo yêu cầu chấm công thay thế không?
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='message'>Lý do yêu cầu chấm công *</Label>
              <textarea
                id='message'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Nhập lý do cần chấm công từ vị trí này...`}
                className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                rows={3}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className='flex items-center gap-3 pt-2'>
              <Button
                type='submit'
                disabled={!message.trim() || isSubmitting}
                className='flex items-center gap-2'
              >
                <Send className='h-4 w-4' />
                {isSubmitting ? 'Đang gửi...' : 'Tạo yêu cầu'}
              </Button>

              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={isSubmitting}
              >
                <X className='h-4 w-4 mr-2' />
                Hủy
              </Button>
            </div>
          </form>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
            <p className='text-xs text-blue-700'>
              💡 Yêu cầu chấm công sẽ được gửi cho quản trị viên để xem xét và
              phê duyệt.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
