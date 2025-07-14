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
  type = 'date',
}: {
  id?: string;
  name?: string;
  initialDate?: Date | null;
  onChange?: (date: Date) => void;
  type?: 'date' | 'datetime-local';
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(
    initialDate ? new Date(initialDate) : undefined,
  );
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [value, setValue] = React.useState(formatDate(date));
  const [time, setTime] = React.useState<string>(() => {
    if (initialDate && type === 'datetime-local') {
      const d = new Date(initialDate);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    }
    return '00:00:00';
  });

  // Function to combine date and time into a single Date object
  const combineDateAndTime = (selectedDate: Date, timeString: string) => {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const combined = new Date(selectedDate);
    combined.setHours(hours, minutes, seconds || 0);
    return combined;
  };

  // Function to trigger onChange with the appropriate date/datetime
  const triggerOnChange = (selectedDate: Date, timeString?: string) => {
    if (onChange) {
      if (type === 'datetime-local' && timeString) {
        const combined = combineDateAndTime(selectedDate, timeString);
        onChange(combined);
      } else {
        onChange(selectedDate);
      }
    }
  };

  React.useEffect(() => {
    if (initialDate) {
      const initialValue = new Date(initialDate);
      setValue(formatDate(initialValue));
      setDate(initialValue);
      setMonth(initialValue);

      if (type === 'datetime-local') {
        const timeValue = `${initialValue.getHours().toString().padStart(2, '0')}:${initialValue.getMinutes().toString().padStart(2, '0')}:${initialValue.getSeconds().toString().padStart(2, '0')}`;
        setTime(timeValue);
      }
    } else {
      setValue('');
      setDate(undefined);
      setMonth(undefined);
      setTime('00:00:00');
    }
  }, [initialDate, type]);

  return (
    <div className='w-full relative flex gap-2'>
      <Input
        name={name}
        hidden
        value={
          date
            ? type === 'datetime-local'
              ? combineDateAndTime(date, time).toISOString()
              : date.toISOString()
            : ''
        }
        className='hidden'
        readOnly
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={'date-picker-' + id}
            variant='outline'
            className='w-full justify-between'
          >
            {date
              ? new Date(date).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : 'Chọn ngày'}
            <CalendarIcon className='ml-2 h-4 w-4' />
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
            onSelect={(selectedDate) => {
              if (selectedDate) {
                setDate(selectedDate);
                setValue(formatDate(selectedDate));
                setMonth(selectedDate);

                setOpen(false);

                if (isValidDate(selectedDate)) {
                  triggerOnChange(selectedDate, time);
                }
              }
            }}
          />
        </PopoverContent>
      </Popover>

      {type === 'datetime-local' && (
        <div className=''>
          <Input
            type='time'
            id={`time-picker-${id}`}
            step='1'
            value={time}
            onChange={(e) => {
              const newTime = e.target.value;
              setTime(newTime);
              if (date && isValidDate(date)) {
                triggerOnChange(date, newTime);
              }
            }}
            className='bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
          />
        </div>
      )}
    </div>
  );
}
