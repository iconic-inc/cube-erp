import { Link } from '@remix-run/react';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { IEmployeeBrief } from '~/interfaces/employee.interface';
import { cn } from '~/lib/utils';

export default function BriefEmployeeCard({
  employee,
  handleRemoveEmployee,
  onClick,
  highlighted = false,
  highlightText = 'Đã chọn',
}: {
  employee: IEmployeeBrief;
  handleRemoveEmployee?: (employee: IEmployeeBrief) => void;
  onClick?: (employee: IEmployeeBrief) => void;
  highlighted?: boolean;
  highlightText?: string;
}) {
  return (
    <Card
      className={cn(
        'relative flex justify-between items-center rounded-lg shadow-sm border border-indigo-200 bg-indigo-50 hover:shadow-md transition-shadow',
        {
          'cursor-pointer': onClick,
          'cursor-default': !onClick,
          'border-2 border-indigo-500 bg-indigo-100': highlighted,
        },
      )}
      onClick={() => onClick && onClick(employee)}
    >
      <CardContent className='flex items-center p-2 sm:p-3 md:p-4 space-x-2 sm:space-x-3 w-full'>
        <Avatar className='h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 border-2 border-indigo-300 flex-shrink-0'>
          {/* <AvatarImage
            src={employee.emp_user.usr_avatar?.img_url}
            alt={`${employee.emp_user.usr_firstName} ${employee.emp_user.usr_lastName} Avatar`}
          /> */}

          <AvatarFallback className='text-sm sm:text-base'>{`${employee.emp_user.usr_firstName[0]}${employee.emp_user.usr_lastName[0]}`}</AvatarFallback>
        </Avatar>

        <Link to={`/erp/employees/${employee.id}`}>
          <div className='min-w-0 flex-1'>
            <p className='text-sm sm:text-base md:text-base font-semibold text-gray-900 truncate'>
              {employee.emp_user.usr_firstName} {employee.emp_user.usr_lastName}
            </p>
            <p className='text-xs sm:text-xs text-gray-600 truncate'>
              @{employee.emp_user.usr_username} ({employee.emp_position})
            </p>
            <p className='text-xs text-gray-500 truncate break-all'>
              {employee.emp_user.usr_email}
            </p>
          </div>
        </Link>
      </CardContent>

      {handleRemoveEmployee && (
        <Button
          variant='destructive'
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveEmployee(employee);
          }}
          className='px-2 sm:px-3 py-1 sm:py-2 h-fit text-sm sm:text-base bg-red-500 hover:bg-red-600 mr-2 sm:mr-3 flex-shrink-0'
        >
          <span className='hidden sm:inline'>Bỏ chọn</span>
          <span className='sm:hidden'>Bỏ</span>
        </Button>
      )}

      {highlighted && (
        <div className='absolute -top-5 sm:-top-6 left-1 bg-indigo-500 rounded-tl-lg rounded-tr-lg px-1 sm:px-2'>
          <span className='text-white text-xs font-semibold'>
            {highlightText}
          </span>
        </div>
      )}
    </Card>
  );
}
