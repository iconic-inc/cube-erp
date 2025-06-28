import { useEffect, useState } from 'react';
import { useFetcher } from '@remix-run/react';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { IEmployee } from '~/interfaces/employee.interface';
import { X } from 'lucide-react';

interface EmployeeSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

export default function EmployeeSelector({
  selectedIds,
  onChange,
  error,
}: EmployeeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<IEmployee[]>([]);
  const [searchResults, setSearchResults] = useState<IEmployee[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const employeeFetcher = useFetcher();

  // Load initial employee data for selected IDs
  useEffect(() => {
    if (selectedIds.length > 0) {
      // This is a simplified version - in a real implementation,
      // you would fetch the employee details from the server
      const query = new URLSearchParams();
      selectedIds.forEach((id) => {
        query.append('ids', id);
      });

      employeeFetcher.load(`/api/employees?${query.toString()}`);
    }
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);

    if (e.target.value.trim().length > 2) {
      setIsSearching(true);
      // In a real implementation, this would trigger a search
      // For now, we'll just use the selectedIds
      setIsSearching(false);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // Add an employee to the selection
  const handleAddEmployee = (employee: IEmployee) => {
    if (!selectedIds.includes(employee.id)) {
      onChange([...selectedIds, employee.id]);
      setSelectedEmployees((prev) => [...prev, employee]);
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  // Remove an employee from the selection
  const handleRemoveEmployee = (id: string) => {
    onChange(selectedIds.filter((employeeId) => employeeId !== id));
    setSelectedEmployees((prev) => prev.filter((emp) => emp.id !== id));
  };

  // Handle adding an employee by ID directly
  const handleAddById = () => {
    const id = searchTerm.trim();
    if (id && !selectedIds.includes(id)) {
      onChange([...selectedIds, id]);
      setSearchTerm('');
    }
  };

  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium'>Người thực hiện</Label>

      <div className='flex gap-2 mb-2'>
        <Input
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder='Nhập ID nhân viên...'
          className='flex-1'
        />
        <Button
          type='button'
          onClick={handleAddById}
          disabled={
            !searchTerm.trim() || selectedIds.includes(searchTerm.trim())
          }
        >
          Thêm
        </Button>
      </div>

      {error && <p className='text-red-500 text-xs mt-1'>{error}</p>}

      {isSearching && <p className='text-sm text-gray-500'>Đang tìm kiếm...</p>}

      {searchResults.length > 0 && (
        <div className='border rounded-md p-2 max-h-40 overflow-y-auto'>
          {searchResults.map((employee) => (
            <div
              key={employee.id}
              className='flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer'
              onClick={() => handleAddEmployee(employee)}
            >
              <div>
                <p className='font-medium'>
                  {employee.emp_user.usr_firstName}{' '}
                  {employee.emp_user.usr_lastName}
                </p>
                <p className='text-xs text-gray-500'>{employee.emp_code}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className='mt-3'>
        <p className='text-sm text-gray-700 mb-2'>
          Đã chọn ({selectedIds.length}):
        </p>
        <div className='flex flex-wrap gap-2'>
          {selectedIds.map((id) => (
            <Badge
              key={id}
              variant='secondary'
              className='flex items-center gap-1 px-2 py-1'
            >
              {id}
              <button
                type='button'
                className='hover:text-red-500 transition-colors'
                onClick={() => handleRemoveEmployee(id)}
              >
                <X size={14} />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <input type='hidden' name='assignees' value={selectedIds.join(',')} />

      <p className='text-xs text-gray-500 mt-2'>
        Lưu ý: Vui lòng nhập ID nhân viên chính xác. Trong tương lai, chức năng
        tìm kiếm sẽ được cải thiện.
      </p>
    </div>
  );
}
