import { RiArrowUpSLine } from '@remixicon/react';
import { useEffect } from 'react';

export default function BackToTop({ className }: { className?: string }) {
  useEffect(() => {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        document.querySelector('#scroll-to-top')?.classList.remove('hidden');
      } else {
        document.querySelector('#scroll-to-top')?.classList.add('hidden');
      }
    });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      id='scroll-to-top'
      onClick={scrollToTop}
      className={`hidden ${className} border-2 border-zinc-400 rounded-full p-3 hover:bg-[--sub4-color]
        hover:text-white hover:border-transparent transition-all duration-300`}
      style={{ position: 'fixed', bottom: 40, right: 40 }}
    >
      <div>
        <RiArrowUpSLine />
      </div>
    </button>
  );
}
