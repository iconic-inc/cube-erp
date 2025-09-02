import { useFetcher } from '@remix-run/react';
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
import { IListColumn } from '~/interfaces/app.interface';
import List from '~/components/List';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';
import { action } from '..';
import {
  IInstallmentCreate,
  InstallmentPlanItem,
} from '~/interfaces/case.interface';
import { Calculator, Edit, Trash2, Plus, Check, XCircle } from 'lucide-react';
import NumericInput from '~/components/NumericInput';

interface InstallmentEditModalProps {
  installment: InstallmentPlanItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (installmentId: string, installment: IInstallmentCreate) => void;
  isNew?: boolean;
}

function InstallmentEditModal({
  installment,
  isOpen,
  onClose,
  onSave,
  isNew = false,
}: InstallmentEditModalProps) {
  const [formData, setFormData] = useState({
    seq: installment?.seq || 1,
    dueDate: installment?.dueDate
      ? new Date(installment.dueDate).toISOString().split('T')[0]
      : '',
    amount: installment?.amount || 0,
    paidAmount: installment?.paidAmount || 0,
    notes: installment?.notes || '',
  });

  useEffect(() => {
    if (installment) {
      setFormData({
        seq: installment.seq,
        dueDate: new Date(installment.dueDate).toISOString().split('T')[0],
        amount: installment.amount,
        paidAmount: installment.paidAmount,
        notes: installment.notes || '',
      });
    }
  }, [installment]);

  const handleSave = () => {
    const updatedInstallment: IInstallmentCreate = {
      seq: formData.seq,
      dueDate: formData.dueDate,
      amount: formData.amount,
      paidAmount: formData.paidAmount,
      notes: formData.notes,
    };

    onSave(installment!.id, updatedInstallment);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Thêm kỳ thanh toán mới' : 'Chỉnh sửa kỳ thanh toán'}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Sequence Number */}
          <div className='space-y-2'>
            <Label htmlFor='seq'>Thứ tự kỳ</Label>
            <Input
              id='seq'
              type='number'
              min='1'
              value={formData.seq}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  seq: parseInt(e.target.value) || 1,
                }))
              }
            />
          </div>

          {/* Due Date */}
          <div className='space-y-2'>
            <Label htmlFor='dueDate'>Ngày đến hạn</Label>
            <Input
              id='dueDate'
              type='date'
              value={formData.dueDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
              }
            />
          </div>

          {/* Amount */}
          <div className='space-y-2'>
            <Label htmlFor='amount'>Số tiền (VNĐ)</Label>
            <NumericInput
              value={formData.amount}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  amount: Number(value),
                }))
              }
            />
          </div>

          {/* paid amount */}
          <div className='space-y-2'>
            <Label htmlFor='paid'>Số tiền đã thanh toán (VNĐ)</Label>
            <NumericInput
              value={formData.paidAmount}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  paidAmount: Number(value),
                }))
              }
            />
          </div>

          {/* Notes */}
          <div className='space-y-2'>
            <Label htmlFor='notes'>Ghi chú</Label>
            <Input
              id='notes'
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder='Ghi chú cho kỳ thanh toán...'
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

export default function CaseInstallmentList({
  caseId,
  installments,
}: {
  caseId: string;
  installments: InstallmentPlanItem[];
}) {
  const fetcher = useFetcher<typeof action>();

  const [editingInstallment, setEditingInstallment] =
    useState<InstallmentPlanItem | null>(null);
  const [isNewInstallment, setIsNewInstallment] = useState(false);

  useEffect(() => {
    // Refresh action column render to get latest installments state
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
                  setEditingInstallment(item);
                  setIsNewInstallment(false);
                }}
              >
                <Edit className='h-4 w-4' />
              </Button>

              <Button
                size='sm'
                type='button'
                variant='outline'
                onClick={() => handleRemoveInstallment(item.id)}
                className='text-red-500'
              >
                <Trash2 className='h-4 w-4' />
              </Button>

              {item.paidAmount > 0 ? (
                <Button
                  type='button'
                  variant='destructive'
                  onClick={() => {
                    handleUpdateInstallment(
                      installments.map((i) => {
                        if (i.id === item.id) {
                          return {
                            ...i,
                            paidAmount: 0,
                          };
                        }
                        return i;
                      }),
                    );
                  }}
                >
                  <XCircle className='h-4 w-4' />
                  Chưa thanh toán
                </Button>
              ) : (
                <Button
                  type='button'
                  onClick={() => {
                    handleUpdateInstallment(
                      installments.map((i) => {
                        if (i.id === item.id) {
                          return {
                            ...i,
                            paidAmount: i.amount,
                          };
                        }
                        return i;
                      }),
                    );
                  }}
                >
                  <Check className='h-4 w-4' />
                  Đã thanh toán
                </Button>
              )}
            </div>
          );
        }
        return col;
      }),
    );
  }, [installments]);

  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<InstallmentPlanItem>[]
  >([
    {
      title: 'Kỳ',
      key: 'seq',
      visible: true,
      render: (item) => <span className='font-medium'>Kỳ {item.seq}</span>,
    },
    {
      title: 'Ngày đến hạn',
      key: 'dueDate',
      visible: true,
      render: (item) => (
        <span className='text-sm'>
          {format(new Date(item.dueDate), 'dd/MM/yyyy', { locale: vi })}
        </span>
      ),
    },
    {
      title: 'Số tiền',
      key: 'amount',
      visible: true,
      render: (item) => (
        <span className='font-medium'>
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(item.amount)}
        </span>
      ),
    },
    {
      title: 'Đã thanh toán',
      key: 'paidAmount',
      visible: true,
      render: (item) => (
        <span className='text-green-600 font-medium'>
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(item.paidAmount)}
        </span>
      ),
    },
    {
      title: 'Ghi chú',
      key: 'notes',
      visible: true,
      render: (item) => (
        <span className='text-gray-600 text-sm truncate max-w-[250px] block'>
          {item.notes || '-'}
        </span>
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

  const handleSaveInstallment = (
    installmentId: string,
    updatedInstallment: IInstallmentCreate,
  ) => {
    let updatedInstallments: IInstallmentCreate[] = installments;
    if (isNewInstallment) updatedInstallments.push(updatedInstallment);
    else
      updatedInstallments = installments.map((i) =>
        i.id === installmentId ? { ...i, ...updatedInstallment } : i,
      );

    // Sort by sequence number
    updatedInstallments.sort((a, b) => a.seq - b.seq);

    handleUpdateInstallment(updatedInstallments);
  };

  const handleRemoveInstallment = (installmentId: string) => {
    const updatedInstallments = installments.filter(
      (i) => i.id !== installmentId,
    );

    handleUpdateInstallment(updatedInstallments);
  };

  const handleUpdateInstallment = (installments: IInstallmentCreate[]) => {
    fetcher.submit(
      {
        op: 'updateCaseServiceInstallment',
        value: JSON.stringify(installments),
      },
      {
        method: 'PATCH',
        action: `/erp/cases/${caseId}?index`,
      },
    );
  };

  const handleAddNew = () => {
    const nextSeq = Math.max(...installments.map((i) => i.seq), 0) + 1;
    setEditingInstallment({
      seq: nextSeq,
      dueDate: new Date().toISOString(),
      amount: 0,
      paidAmount: 0,
      notes: '',
      id: undefined as any, // ignore
      status: undefined as any, // ignore
    });
    setIsNewInstallment(true);
  };

  return (
    <div className='space-y-3 sm:space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
          <Calculator className='mr-2' />
          Kế hoạch thanh toán
        </h3>

        <div className='flex justify-end space-x-2'>
          <Button type='button' onClick={handleAddNew}>
            <Plus className='h-4 w-4 mr-2' />
            Thêm kỳ thanh toán
          </Button>
        </div>
      </div>

      <div className=''>
        <List<InstallmentPlanItem>
          name='Kế hoạch thanh toán'
          itemsPromise={{ data: installments, pagination: {} as any }}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          showPagination={false}
          showToolbar={false}
          readOnly
        />

        {editingInstallment && (
          <InstallmentEditModal
            installment={editingInstallment}
            isOpen={true}
            onClose={() => {
              setEditingInstallment(null);
              setIsNewInstallment(false);
            }}
            onSave={handleSaveInstallment}
            isNew={isNewInstallment}
          />
        )}
      </div>
    </div>
  );
}
