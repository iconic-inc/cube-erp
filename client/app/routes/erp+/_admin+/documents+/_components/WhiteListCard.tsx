import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { IEmployee } from '~/interfaces/employee.interface';

export default function WhiteListCard({
  employee,
  handleRemoveEmployee,
}: {
  employee: IEmployee;
  handleRemoveEmployee?: (employee: IEmployee) => void;
}) {
  return (
    <Card className='flex justify-between items-center rounded-lg shadow-sm border border-indigo-200 bg-indigo-50 hover:shadow-md transition-shadow'>
      <CardContent className='flex items-center p-4 space-x-3'>
        <Avatar className='h-10 w-10 border-2 border-indigo-300'>
          <AvatarImage
            src={employee.emp_user.usr_avatar?.img_url}
            alt={`${employee.emp_user.usr_firstName} ${employee.emp_user.usr_lastName} Avatar`}
          />

          <AvatarFallback>{`${employee.emp_user.usr_firstName[0]}${employee.emp_user.usr_lastName[0]}`}</AvatarFallback>
        </Avatar>
        <div>
          <p className='text-base font-semibold text-gray-900'>
            {employee.emp_user.usr_firstName} {employee.emp_user.usr_lastName}
          </p>
          <p className='text-xs text-gray-600'>
            @{employee.emp_user.usr_username} ({employee.emp_position})
          </p>
          <p className='text-xs text-gray-500'>{employee.emp_user.usr_email}</p>
        </div>
      </CardContent>

      {handleRemoveEmployee && (
        <Button
          variant='destructive'
          onClick={() => handleRemoveEmployee(employee)}
          className='px-3 py-2 h-auto text-xs bg-red-500 hover:bg-red-600 mr-4'
        >
          Bỏ chọn
        </Button>
      )}
    </Card>
  );
}
