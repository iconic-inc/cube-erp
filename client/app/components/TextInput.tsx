import { DetailedHTMLProps, InputHTMLAttributes } from 'react';

export default function TextInput({
  label,
  name,
  type = 'text',
  pattern,
  oneline = false,
  onChange,
  className,
  ...props
}: {
  name?: string;
  label: React.ReactNode;
  value?: string | number;
  oneline?: boolean;
  pattern?: string;
  onChange?: (e: any) => void;
} & Omit<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  'onChange'
>) {
  return (
    <div className={`w-full ${oneline ? 'flex' : ''} items-center gap-4`}>
      <label
        htmlFor={name}
        className='block text-sm font-semibold leading-6 text-gray-700'
      >
        {label}
      </label>
      <div className='mt-1 flex-grow'>
        <input
          type={type}
          name={name}
          id={name}
          // step={props.step || 1000}
          pattern={pattern}
          onChange={(e) => onChange && onChange(e.target.value)}
          autoComplete={name}
          className={
            `block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition ` +
            className
          }
          {...props}
        />
      </div>
    </div>
  );
}
