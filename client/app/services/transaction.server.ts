import { ISessionUser } from '~/interfaces/auth.interface';
import { fetcher } from '.';
import { IPaginationOptions } from '~/interfaces/request.interface';
import { IListResponse } from '~/interfaces/response.interface';
import {
  ITransaction,
  ITransactionCreate,
  ITransactionUpdate,
  ITransactionQuery,
} from '~/interfaces/transaction.interface';

// Get list of transactions with pagination and query
const getTransactions = async (
  query: ITransactionQuery = {},
  options: IPaginationOptions = {},
  request: ISessionUser,
) => {
  const { page = 1, limit = 10, sortBy, sortOrder } = options;

  const searchParams = new URLSearchParams();

  // Add query parameters
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  // Add pagination and sorting options
  if (sortBy) searchParams.set('sortBy', sortBy);
  if (sortOrder) searchParams.set('sortOrder', sortOrder);
  searchParams.set('page', String(page));
  searchParams.set('limit', String(limit));

  const response = await fetcher<IListResponse<ITransaction>>(
    `/transactions?${searchParams.toString()}`,
    { request },
  );
  return response;
};

// Get a transaction by ID
const getTransactionById = async (id: string, request: ISessionUser) => {
  const response = await fetcher<any>(`/transactions/${id}`, {
    request,
  });
  return response as ITransaction;
};

// Create a new transaction
const createTransaction = async (
  transactionData: ITransactionCreate,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<ITransaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
      request,
    });

    return response;
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Update a transaction
const updateTransaction = async (
  id: string,
  data: ITransactionUpdate,
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<ITransaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      request,
    });
    return response;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

// Delete a transaction
const deleteTransaction = async (id: string, request: ISessionUser) => {
  try {
    const response = await fetcher<any>(`/transactions/${id}`, {
      method: 'DELETE',
      request,
    });
    return response;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// Bulk delete transactions
const bulkDeleteTransactions = async (
  transactionIds: string[],
  request: ISessionUser,
) => {
  try {
    const response = await fetcher<any>(`/transactions/bulk`, {
      method: 'DELETE',
      body: JSON.stringify({ transactionIds }),
      request,
    });
    return response;
  } catch (error) {
    console.error('Error bulk deleting transactions:', error);
    throw error;
  }
};

// Export transactions to XLSX
const exportTransactionsToXLSX = async (
  query: ITransactionQuery = {},
  options: IPaginationOptions = {},
  request: ISessionUser,
) => {
  const searchParams = new URLSearchParams();

  // Add query parameters
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  // Add sorting options
  if (options.sortBy) searchParams.set('sortBy', options.sortBy);
  if (options.sortOrder) searchParams.set('sortOrder', options.sortOrder);

  return await fetcher<{ fileUrl: string; fileName: string; count: number }>(
    `/transactions/export/xlsx?${searchParams.toString()}`,
    {
      method: 'GET',
      request,
    },
  );
};

// Get debt transactions (transactions with unpaid amounts)
const getDebtTransactions = async (
  query: ITransactionQuery = {},
  options: IPaginationOptions = {},
  request: ISessionUser,
) => {
  const debtQuery = { ...query, type: 'debt' as const };
  return await getTransactions(debtQuery, options, request);
};

// Get transaction statistics
const getTransactionStatistics = async (
  query: ITransactionQuery = {},
  request: ISessionUser,
) => {
  const searchParams = new URLSearchParams();

  // Add query parameters for filtering statistics
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return await fetcher<{
    totalIncome: number;
    totalOutcome: number;
    totalDebt: number;
    totalPaid: number;
    totalUnpaid: number;
    transactionCount: number;
  }>(`/transactions/statistics?${searchParams.toString()}`, {
    method: 'GET',
    request,
  });
};

export {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  exportTransactionsToXLSX,
  getDebtTransactions,
  getTransactionStatistics,
};
