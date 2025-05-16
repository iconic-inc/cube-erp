import { DetailedHTMLProps, TextareaHTMLAttributes } from 'react';

export default function TextAreaInput({
  label,
  name,
  type = 'text',
  pattern,
  onChange,
  className,
  ...props
}: {
  name: string;
  label: string;
  type?: string;
  pattern?: string;
  onChange?: (value: any) => void;
} & Omit<
  DetailedHTMLProps<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  >,
  'onChange'
>) {
  return (
    <div className='w-full h-full flex flex-col gap-2'>
      <label
        htmlFor={name}
        className='block text-sm font-semibold leading-6 text-black'
      >
        {label}
      </label>
      <div className='flex-grow'>
        <textarea
          name={name}
          id={name}
          onChange={(e) => onChange && onChange(e.target.value)}
          className={
            `block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none 
            focus:ring-1 focus:ring-red-500 focus:border-red-500 transition ` +
            className
          }
          {...props}
        />
      </div>
    </div>
  );
}
