import { useFetcher } from '@remix-run/react';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import TextAreaInput from '~/components/TextAreaInput';
import { IListColumn } from '~/interfaces/app.interface';
import List from '~/components/List';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';
import { action } from '..';
import { IIncurredCostCreate, IncurredCost } from '~/interfaces/case.interface';
import { Receipt, Edit, Trash2, Plus, Check } from 'lucide-react';
import NumericInput from '~/components/NumericInput';
import { SelectSearch } from '~/components/ui/SelectSearch';
import { TRANSACTION } from '~/constants/transaction.constant';

interface IncurredCostEditModalProps {
  incurredCost: IIncurredCostCreate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (incurredCost: IIncurredCostCreate) => void;
  isNew?: boolean;
}

function IncurredCostEditModal({
  incurredCost,
  isOpen,
  onClose,
  onSave,
  isNew = false,
}: IncurredCostEditModalProps) {
  const [formData, setFormData] = useState({
    date: incurredCost?.date
      ? new Date(incurredCost.date).toISOString().split('T')[0]
      : '',
    category: incurredCost?.category || '',
    description: incurredCost?.description || '',
    amount: incurredCost?.amount || 0,
  });

  useEffect(() => {
    if (incurredCost) {
      setFormData({
        date: new Date(incurredCost.date).toISOString().split('T')[0],
        category: incurredCost.category,
        description: incurredCost.description || '',
        amount: incurredCost.amount,
      });
    }
  }, [incurredCost]);

  const handleSave = () => {
    if (!formData.date || !formData.category || formData.amount <= 0) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const updatedIncurredCost: IIncurredCostCreate = {
      date: formData.date,
      category: formData.category,
      description: formData.description,
      amount: formData.amount,
    };

    onSave(updatedIncurredCost);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>
            {isNew
              ? 'Thêm chi phí phát sinh mới'
              : 'Chỉnh sửa chi phí phát sinh'}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Date */}
          <div className='space-y-2'>
            <Label htmlFor='date'>Ngày phát sinh *</Label>
            <Input
              id='date'
              type='date'
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              required
            />
          </div>

          {/* Category */}
          <div className='space-y-2'>
            <Label htmlFor='category'>Loại chi phí *</Label>
            <SelectSearch
              id='category'
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
              placeholder='Nhập loại chi phí...'
              options={Object.values(TRANSACTION.CATEGORY.outcome)}
            />
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Mô tả</Label>
            <TextAreaInput
              name='description'
              label=''
              value={formData.description}
              onChange={(value: string) =>
                setFormData((prev) => ({ ...prev, description: value }))
              }
              placeholder='Mô tả chi tiết về chi phí...'
            />
          </div>

          {/* Amount */}
          <div className='space-y-2'>
            <Label htmlFor='amount'>Số tiền (VNĐ) *</Label>
            <NumericInput
              value={formData.amount}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  amount: Number(value),
                }))
              }
              required
            />
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

export default function CaseIncurredCostList({
  caseId,
  incurredCosts,
}: {
  caseId: string;
  incurredCosts: IncurredCost[];
}) {
  const fetcher = useFetcher<typeof action>();

  const [editingIncurredCost, setEditingIncurredCost] =
    useState<IIncurredCostCreate | null>(null);
  const [isNewIncurredCost, setIsNewIncurredCost] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<IncurredCost>[]
  >([
    {
      title: 'Ngày',
      key: 'date',
      visible: true,
      render: (item) => (
        <span className='text-sm'>
          {format(new Date(item.date), 'dd/MM/yyyy', { locale: vi })}
        </span>
      ),
    },
    {
      title: 'Loại chi phí',
      key: 'category',
      visible: true,
      render: (item) => <span className='font-medium'>{item.category}</span>,
    },
    {
      title: 'Mô tả',
      key: 'description',
      visible: true,
      render: (item) => (
        <span className='text-gray-600 text-sm truncate max-w-[200px] block'>
          {item.description || '-'}
        </span>
      ),
    },
    {
      title: 'Số tiền',
      key: 'amount',
      visible: true,
      render: (item) => (
        <span className='font-medium text-red-600'>
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(item.amount)}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      visible: true,
      render: (item) => (
        <div className='flex space-x-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              setEditingIncurredCost(item);
              setIsNewIncurredCost(false);
            }}
          >
            <Edit className='h-4 w-4' />
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => handleRemoveIncurredCost(item.id)}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      ),
    },
  ]);

  useFetcherResponseHandler(fetcher);

  const handleSaveIncurredCost = (updatedIncurredCost: IIncurredCostCreate) => {
    let updatedIncurredCosts = [...incurredCosts, updatedIncurredCost];

    // Sort by date (newest first)
    updatedIncurredCosts.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    fetcher.submit(
      {
        op: 'updateCaseServiceIncurredCost',
        value: JSON.stringify(updatedIncurredCosts),
      },
      {
        method: 'PATCH',
        action: `/erp/cases/${caseId}?index`,
      },
    );
  };

  const handleRemoveIncurredCost = (incurredCostId: string) => {
    const updatedIncurredCosts = incurredCosts.filter(
      (c) => c.id !== incurredCostId,
    );

    fetcher.submit(
      {
        op: 'updateCaseServiceIncurredCost',
        value: JSON.stringify(updatedIncurredCosts),
      },
      {
        method: 'PATCH',
        action: `/erp/cases/${caseId}?index`,
      },
    );
  };

  const handleAddNew = () => {
    setEditingIncurredCost({
      date: new Date().toISOString(),
      category: '',
      description: '',
      amount: 0,
    });
    setIsNewIncurredCost(true);
  };

  // Calculate total incurred costs
  const totalIncurredCosts = incurredCosts.reduce(
    (sum, cost) => sum + cost.amount,
    0,
  );

  return (
    <div className='space-y-3 sm:space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
          <Receipt className='mr-2' />
          Chi phí phát sinh
          <span className='ml-2 text-sm font-normal text-gray-500'>
            (Tổng:{' '}
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(totalIncurredCosts)}
            )
          </span>
        </h3>

        <div className='flex justify-end space-x-2'>
          <Button type='button' onClick={handleAddNew}>
            <Plus className='h-4 w-4 mr-2' />
            Thêm chi phí
          </Button>
        </div>
      </div>

      <div className=''>
        <List<IncurredCost>
          name='Chi phí phát sinh'
          itemsPromise={{ data: incurredCosts, pagination: {} as any }}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          showPagination={false}
          showToolbar={false}
        />

        {editingIncurredCost && (
          <IncurredCostEditModal
            incurredCost={editingIncurredCost}
            isOpen={true}
            onClose={() => {
              setEditingIncurredCost(null);
              setIsNewIncurredCost(false);
            }}
            onSave={handleSaveIncurredCost}
            isNew={isNewIncurredCost}
          />
        )}
      </div>
    </div>
  );
}
