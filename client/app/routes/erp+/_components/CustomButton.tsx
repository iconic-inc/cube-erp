import { Link } from '@remix-run/react';

export default function CustomButton({
  children,
  className,
  color = 'blue',
  tagType = 'button',
  href = '#',
  ...props
}: {
  children?: React.ReactNode;
  color?: keyof typeof colorClasses;
  tagType?: 'button' | 'link';
  href?: string;
} & React.ComponentProps<'button' | 'a'>) {
  const colorClass = colorClasses[color] || colorClasses.blue;
  const btnClass = `flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5 disabled:cursor-not-allowed ${colorClass} ${className || ''}`;

  switch (tagType) {
    case 'link':
      return (
        <Link
          to={href}
          className={btnClass}
          {...(props as React.ComponentProps<'a'>)}
        >
          {children}
        </Link>
      );

    default:
      return (
        <button
          className={btnClass}
          {...(props as React.ComponentProps<'button'>)}
        >
          {children}
        </button>
      );
  }
}

const colorClasses = {
  blue: 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white',
  red: 'bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white',
  gray: 'bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white',
  green: 'bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white',
  orange: 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white',
  transparent:
    'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100',
};
