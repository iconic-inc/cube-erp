import { useEffect, useState } from 'react';

import { Button } from '~/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '~/lib/utils';

interface SelectSearchOption {
  value: string;
  label: string;
}

interface SelectSearchProps {
  options: SelectSearchOption[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  name?: string; // Added name prop
  id?: string; // Added id prop
}

export function SelectSearch({
  options,
  defaultValue,
  onValueChange,
  value,
  placeholder = 'Select an option...',
  name, // Destructure name
  id, // Destructure id
}: SelectSearchProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (selectedLabel: string) => {
    // Find the actual value based on the selected label
    const selectedOption = options.find(
      (option) => option.label.toLowerCase() === selectedLabel.toLowerCase(),
    );
    const newValue = selectedOption ? selectedOption.value : '';

    // If the new value is the same as the current, clear it, otherwise set the new value
    const finalValue = newValue === value ? '' : newValue;
    setOpen(false);
    onValueChange?.(finalValue); // Call the provided onValueChange handler
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between bg-transparent'
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0'>
        <Command>
          <CommandInput placeholder={placeholder} autoFocus />
          <CommandList>
            <CommandEmpty>Không có kết quả nào phù hợp</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === option.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      {/* Hidden input to act as the form field */}
      <input type='hidden' name={name} id={id} value={value} />
    </Popover>
  );
}
