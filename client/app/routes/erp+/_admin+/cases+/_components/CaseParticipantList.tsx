import { Link, useFetcher, useNavigate } from '@remix-run/react';
import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { IListResponse } from '~/interfaces/response.interface';
import { IListColumn } from '~/interfaces/app.interface';
import List from '~/components/List';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';
import { action } from '..';
import EmployeePicker from '~/components/EmployeePicker';
import { IEmployee } from '~/interfaces/employee.interface';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import {
  CaseParticipant,
  CaseParticipantBrief,
} from '~/interfaces/case.interface';
import { User, Edit, Trash2, Plus } from 'lucide-react';
import NumericInput from '~/components/NumericInput';

// Commission types
const COMMISSION_TYPES = [
  { value: 'PERCENT_OF_GROSS', label: 'Phần trăm doanh thu thực' },
  { value: 'PERCENT_OF_NET', label: 'Phần trăm doanh thu ròng' },
  { value: 'FLAT', label: 'Số tiền cố định' },
] as const;

interface ParticipantEditModalProps {
  participant: CaseParticipantBrief | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (participantId: string, participant: CaseParticipant) => void;
  isNew?: boolean;
}

function ParticipantEditModal({
  participant,
  isOpen,
  onClose,
  onSave,
  isNew = false,
}: ParticipantEditModalProps) {
  const employee = participant?.employeeId;
  const [formData, setFormData] = useState({
    role: participant?.role || 'PARTICIPANT',
    commissionType: participant?.commission?.type || 'PERCENT_OF_NET',
    commissionValue: participant?.commission?.value || 0,
  });

  useEffect(() => {
    if (participant) {
      setFormData({
        role: participant.role || 'PARTICIPANT',
        commissionType: participant.commission?.type || 'PERCENT_OF_NET',
        commissionValue: participant.commission?.value || 0,
      });
    }
  }, [participant]);

  const handleSave = () => {
    if (!participant) return;

    const updatedParticipant: CaseParticipant = {
      employeeId: participant.employeeId._id,
      role: formData.role,
      commission: {
        type: formData.commissionType as
          | 'PERCENT_OF_GROSS'
          | 'PERCENT_OF_NET'
          | 'FLAT',
        value: formData.commissionValue,
      },
    };

    onSave(participant.employeeId._id, updatedParticipant);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>
            {isNew
              ? 'Thêm người tham gia mới'
              : 'Chỉnh sửa thông tin người tham gia'}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Employee Info */}
          <div className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'>
            <Avatar className='w-10 h-10'>
              <AvatarFallback className='bg-gray-200 text-gray-600 font-bold'>
                {employee?.emp_user.usr_firstName?.charAt(0).toUpperCase() ||
                  'N/A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className='font-medium'>
                {employee?.emp_user.usr_firstName}{' '}
                {employee?.emp_user.usr_lastName}
              </p>
              <p className='text-sm text-gray-500'>{employee?.emp_code}</p>
            </div>
          </div>

          {/* Commission Type */}
          <div className='space-y-2'>
            <Label htmlFor='commissionType'>Loại hoa hồng</Label>
            <Select
              value={formData.commissionType}
              onValueChange={(value: any) =>
                setFormData((prev) => ({ ...prev, commissionType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Chọn loại hoa hồng' />
              </SelectTrigger>
              <SelectContent>
                {COMMISSION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Commission Value */}
          <div className='space-y-2'>
            <Label htmlFor='commissionValue'>
              Giá trị hoa hồng{' '}
              {formData.commissionType === 'FLAT' ? '(VNĐ)' : '(%)'}
            </Label>
            {formData.commissionType === 'FLAT' ? (
              <NumericInput
                value={formData.commissionValue}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    commissionValue: Number(value),
                  }))
                }
              />
            ) : (
              <Input
                id='commissionValue'
                type='number'
                min='0'
                step='0.1'
                max='100'
                value={formData.commissionValue}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    commissionValue: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end space-x-2 pt-4'>
            <Button variant='outline' onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {isNew ? 'Thêm' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CaseParticipantList({
  caseId,
  caseParticipants,
}: {
  caseId: string;
  caseParticipants: CaseParticipantBrief[];
}) {
  const fetcher = useFetcher<typeof action>();

  const [editingParticipant, setEditingParticipant] =
    useState<CaseParticipantBrief | null>(null);
  const [isNewParticipant, setIsNewParticipant] = useState(false);
  const [openEmployeePicker, setOpenEmployeePicker] = useState(false);

  useEffect(() => {
    // Refresh action column render to get latest participants state
    setVisibleColumns(
      visibleColumns.map((col) => {
        if (col.key === 'actions') {
          col.render = (item) => (
            <div className='flex space-x-2'>
              <Button
                size='sm'
                variant='outline'
                type='button'
                onClick={() => {
                  setEditingParticipant(item);
                  setIsNewParticipant(false);
                }}
              >
                <Edit className='h-4 w-4' />
              </Button>
              <Button
                size='sm'
                variant='outline'
                type='button'
                onClick={() => handleRemoveParticipant(item.employeeId._id)}
                className='text-red-500'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          );
        }
        return col;
      }),
    );
  }, [caseParticipants]);

  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<CaseParticipantBrief>[]
  >([
    {
      title: 'Tên nhân viên',
      key: 'name',
      visible: true,
      render: (item) => (
        <Link
          prefetch='intent'
          to={`/erp/employees/${item.employeeId._id}`}
          className='text-blue-600 hover:underline flex items-center'
        >
          <Avatar className='w-6 h-6 sm:w-8 sm:h-8 mr-2 shrink-0'>
            <AvatarFallback className='bg-gray-200 text-gray-600 font-bold text-sm sm:text-base'>
              {item.employeeId?.emp_user.usr_firstName
                ?.charAt(0)
                .toUpperCase() || 'N/A'}
            </AvatarFallback>
          </Avatar>
          <div className='flex flex-col min-w-0 flex-1'>
            <span className='text-sm sm:text-base font-medium truncate'>
              {item.employeeId?.emp_user.usr_firstName}{' '}
              {item.employeeId?.emp_user.usr_lastName}
            </span>
            <span className='text-gray-500 text-sm sm:text-base truncate'>
              {item.employeeId?.emp_code || 'Chưa có mã'}
            </span>
          </div>
        </Link>
      ),
    },
    {
      title: 'Email',
      key: 'email',
      visible: true,
      render: (item) => (
        <span className='text-gray-600 text-sm sm:text-base truncate block max-w-[150px] sm:max-w-none'>
          {item.employeeId?.emp_user.usr_email || 'Chưa có email'}
        </span>
      ),
    },
    {
      title: 'Hoa hồng',
      key: 'commission',
      visible: true,
      render: (item) => (
        <div className='text-sm'>
          <div className='font-medium'>
            {item.commission.value}
            {item.commission.type === 'FLAT' ? ' VNĐ' : '%'}
          </div>
          <div className='text-gray-500 text-xs'>
            {
              COMMISSION_TYPES.find(
                (type) => type.value === item.commission.type,
              )?.label
            }
          </div>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      visible: true,
      render: (item) => <></>,
    },
  ]);

  useFetcherResponseHandler(fetcher);

  const handleSaveParticipant = (
    participantId: string,
    updatedParticipant: CaseParticipant,
  ) => {
    let updatedParticipants: CaseParticipant[] = caseParticipants.map((p) => ({
      ...p,
      employeeId: p.employeeId._id,
    }));

    if (isNewParticipant) {
      updatedParticipants.push(updatedParticipant);
    } else {
      updatedParticipants = updatedParticipants.map((p) =>
        p.employeeId === participantId ? updatedParticipant : p,
      );
    }

    handleUpdateParticipants(updatedParticipants);
  };

  const handleRemoveParticipant = (employeeId: string) => {
    const updatedParticipants = caseParticipants
      .filter((p) => p.employeeId._id !== employeeId)
      .map((p) => ({ ...p, employeeId: p.employeeId._id }) as CaseParticipant);

    handleUpdateParticipants(updatedParticipants);
  };

  const handleUpdateParticipants = (participants: CaseParticipant[]) => {
    fetcher.submit(
      {
        op: 'updateCaseServiceParticipant',
        value: JSON.stringify(participants),
      },
      {
        method: 'PATCH',
        action: `/erp/cases/${caseId}?index`,
      },
    );
  };

  return (
    <div className='space-y-3 sm:space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
          <User className='mr-2' />
          Nhân viên phụ trách
        </h3>

        <div className='flex justify-end space-x-2'>
          <Button type='button' onClick={() => setOpenEmployeePicker(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Thêm nhân viên
          </Button>
        </div>
      </div>

      <div className=''>
        <List<CaseParticipantBrief>
          name='Nhân sự'
          itemsPromise={{ data: caseParticipants, pagination: {} as any }}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          showPagination={false}
          showToolbar={false}
          readOnly
        />

        {openEmployeePicker && (
          <EmployeePicker
            onClose={() => setOpenEmployeePicker(false)}
            employeeGetter={async () => {
              try {
                const response = await fetch(
                  `/api/data?getter=getEmployees&limit=10000&page=1`,
                );
                const data: IListResponse<IEmployee> = await response.json();

                return {
                  data: data.data.filter(
                    (employee) =>
                      !caseParticipants.find(
                        (p) => p.employeeId._id === employee.id,
                      ),
                  ),
                  pagination: data.pagination,
                };
              } catch (error) {
                console.error('Error fetching employees:', error);
                toast.error('Có lỗi xảy ra khi tải nhân viên');
                return { data: [], pagination: {} as any };
              }
            }}
            onSelect={(selectedEmployees: IEmployee[]) => {
              const newParticipants = selectedEmployees.map((employee) => ({
                employeeId: employee.id,
                role: 'PARTICIPANT',
                commission: {
                  type: 'PERCENT_OF_NET' as const,
                  value: 0,
                  eligibleOn: 'AT_CLOSURE' as const,
                },
              }));

              handleUpdateParticipants([
                ...newParticipants,
                ...caseParticipants.map(
                  (p) =>
                    ({
                      ...p,
                      employeeId: p.employeeId._id,
                    }) as CaseParticipant,
                ),
              ]);
            }}
          />
        )}

        {editingParticipant && (
          <ParticipantEditModal
            participant={editingParticipant}
            isOpen={true}
            onClose={() => {
              setEditingParticipant(null);
              setIsNewParticipant(false);
            }}
            onSave={handleSaveParticipant}
            isNew={isNewParticipant}
          />
        )}
      </div>
    </div>
  );
}
