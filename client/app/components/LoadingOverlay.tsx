import { LoaderCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function LoadingOverlay() {
  useEffect(() => {
    const html = document.querySelector('html');

    if (html) {
      html.style.overflowY = 'hidden';

      return () => {
        html.style.overflowY = '';
      };
    }
  });

  return (
    <div className='fixed inset-0 bg-white/70 z-[9999]'>
      <div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
        <div role='status'>
          <LoaderCircle className='w-32 h-32 animate-spin text-red-600' />

          <span className='sr-only'>Loading...</span>
        </div>
      </div>
    </div>
  );
}
