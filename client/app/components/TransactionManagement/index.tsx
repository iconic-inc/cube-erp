import { Link } from '@remix-run/react';
import Defer from '~/components/Defer';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { ITransaction } from '~/interfaces/transaction.interface';
import { formatAttributeName, formatDate } from '~/utils';
import { Plus } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { TRANSACTION } from '~/constants/transaction.constant';
import BriefTransactionCard from './BriefTransactionCard';
import { useEffect, useState } from 'react';
import { isResolveError } from '~/lib';
import ErrorCard from '../ErrorCard';
import BriefTransactionForm from './BriefTransactionForm';

interface TransactionManagementProps {
  transactionsPromise?: ILoaderDataPromise<IListResponse<ITransaction>>;
}

export default function TransactionManagement({
  transactionsPromise,
}: TransactionManagementProps): JSX.Element {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isShowForm, setIsShowForm] = useState(false);

  useEffect(() => {
    const loadTransactions = async () => {
      if (transactionsPromise) {
        const transactionsData = await transactionsPromise;
        if (isResolveError(transactionsData)) {
          setError(transactionsData.message || 'Có lỗi xảy ra khi tải dữ liệu');
        } else setTransactions(transactionsData?.data || []);
      }
    };

    loadTransactions();

    return () => {
      // Cleanup if needed
    };
  }, [transactionsPromise]);

  return (
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0'>
        <div className='text-center sm:text-left w-full'>
          <CardTitle className='text-white text-lg sm:text-xl lg:text-2xl font-bold'>
            Đợt thanh toán
          </CardTitle>
        </div>
        <Button
          variant='secondary'
          size='sm'
          className='bg-white text-red-700 hover:bg-red-50 text-sm sm:text-base px-2 sm:px-3 py-1 sm:py-2 mx-auto sm:m-0 w-fit'
          asChild
        >
          <Button type='button' onClick={() => setIsShowForm(true)}>
            <Plus className='w-3 h-3 sm:w-4 sm:h-4' />
            <span className='hidden sm:inline'>Tạo giao dịch mới</span>
            <span className='sm:hidden'>Tạo mới</span>
          </Button>
        </Button>
      </CardHeader>
      <CardContent className='space-y-4 p-4 sm:p-6'>
        {error && <ErrorCard message={error} />}

        {!error && transactions.length === 0 ? (
          <div className='text-center py-6 sm:py-8 text-gray-500'>
            <p className='text-base sm:text-lg'>Chưa có Đợt thanh toán nào</p>
            <p className='text-sm sm:text-base mt-2'>
              Tạo Đợt thanh toán mới để bắt đầu quản lý tài chính
            </p>
          </div>
        ) : (
          <div className=''>
            <div className='space-y-3 sm:space-y-4'>
              {transactions.map((transaction) => (
                <BriefTransactionCard
                  key={transaction.tx_code}
                  transaction={transaction}
                />
              ))}
            </div>
          </div>
        )}

        {isShowForm && (
          <BriefTransactionForm
            onConfirm={(transaction) => {
              setTransactions((prev) => [
                ...prev,
                formatAttributeName(transaction, 'tx_') as any,
              ]);
              setIsShowForm(false);
            }}
            onCancel={() => {
              setIsShowForm(false);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
