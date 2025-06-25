import { cn } from '~/lib/utils';
import './index.css';

export default function TextRenderer({
  content,
  truncate,
  className,
}: {
  content: string;
  truncate?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn('text-gray-800 leading-relaxed', className)}
      style={
        truncate
          ? {
              display: '-webkit-box',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflowWrap: 'break-word',
              overflow: 'hidden',
            }
          : {}
      }
      dangerouslySetInnerHTML={{
        __html: content,
      }}
    ></section>
  );
}
