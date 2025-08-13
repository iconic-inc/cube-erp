import { NumericFormat } from 'react-number-format';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { ReactNode } from 'react';

export default function NumericInput({
  label,
  value,
  onValueChange,
  errors,
  required = false,
}: {
  label?: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  errors?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label
        htmlFor='amount'
        className='text-gray-700 font-semibold mb-2 block'
      >
        {label || (
          <>
            Số tiền <span className='text-red-500'>*</span>
          </>
        )}
      </Label>
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
          className='bg-white border-gray-300 pl-8 pr-12 text-right font-medium'
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
