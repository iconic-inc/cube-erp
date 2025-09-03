import { NumericFormat } from 'react-number-format';
import { Input } from './ui/input';

export default function NumericInput({
  value,
  onValueChange,
  errors,
  required = false,
}: {
  value: string | number;
  onValueChange: (value: string) => void;
  errors?: string;
  required?: boolean;
}) {
  return (
    <div>
      <div className='relative'>
        <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm z-10'>
          ₫
        </span>
        <NumericFormat
          id='amount'
          name='amount'
          value={value}
          onValueChange={(values) => {
            onValueChange(values.value);
          }}
          placeholder='0'
          step={1000}
          thousandSeparator=','
          decimalSeparator='.'
          decimalScale={2}
          allowNegative={false}
          allowLeadingZeros={false}
          customInput={Input}
          className='text-right flex h-9 w-full rounded-md border border-input bg-transparent pl-6 pr-12 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'
          required={required}
        />
        <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm'>
          VNĐ
        </span>
      </div>
      {errors && <p className='text-red-500 text-sm mt-1'>{errors}</p>}
    </div>
  );
}
