'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';

import { Button } from './button';
import { Calendar } from './calendar';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

function formatDate(date: Date | undefined) {
  if (!date) {
    return '';
  }

  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

export function DatePicker({
  id,
  name,
  initialDate,
  onChange,
}: {
  id?: string;
  name?: string;
  initialDate?: Date | null;
  onChange?: (date: Date) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(
    initialDate ? new Date(initialDate) : undefined,
  );
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [value, setValue] = React.useState(formatDate(date));

  React.useEffect(() => {
    if (initialDate) {
      const initialValue = formatDate(new Date(initialDate));
      setValue(initialValue);
      setDate(new Date(initialDate));
      setMonth(new Date(initialDate));
    }
  }, [initialDate]);

  return (
    <div className='relative flex gap-2'>
      <Input name={name} hidden value={value} className='hidden' readOnly />
      <Input
        id={id}
        value={
          date
            ? new Date(date).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })
            : ''
        }
        className='bg-background pr-10'
        onChange={(e) => {
          const date = new Date(e.target.value);
          setValue(e.target.value);
          if (isValidDate(date)) {
            setDate(date);
            setMonth(date);
            if (onChange) {
              onChange(date);
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        readOnly
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id='date-picker'
            variant='ghost'
            className='absolute top-1/2 right-2 size-6 -translate-y-1/2'
          >
            <CalendarIcon className='size-3.5' />
            <span className='sr-only'>Chọn ngày</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className='w-auto overflow-hidden p-0'
          align='end'
          alignOffset={-8}
          sideOffset={10}
        >
          <Calendar
            mode='single'
            selected={date}
            captionLayout='dropdown'
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => {
              setDate(date);
              setValue(formatDate(date));
              setMonth(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
