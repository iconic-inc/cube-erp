import { Request, Response } from 'express';
import { BadRequestError } from '../core/errors';
import fs from 'fs';
import { OK } from '../core/success.response';
import {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  updateTransaction,
  exportTransactionsToXLSX,
  getTransactions,
  bulkDeleteTransactions,
  getTransactionStatistics,
} from '@services/transaction.service';

export class TransactionController {
  /**
   * Get all transactions with filtering, pagination, sorting, and search
   */
  static async getAllTransactions(req: Request, res: Response) {
    return OK({
      res,
      message: 'Giao dịch được tải thành công',
      metadata: await getTransactions(req.query),
    });
  }

  /**
   * Get a transaction by ID
   */
  static async getTransactionById(req: Request, res: Response) {
    return OK({
      res,
      message: 'Giao dịch được tải thành công',
      metadata: await getTransactionById(req.params.id),
    });
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(req: Request, res: Response) {
    return OK({
      res,
      message: 'Giao dịch được tạo thành công',
      metadata: await createTransaction(req.user.userId, req.body),
    });
  }

  /**
   * Update a transaction
   */
  static async updateTransaction(req: Request, res: Response) {
    return OK({
      res,
      message: 'Giao dịch được cập nhật thành công',
      metadata: await updateTransaction(req.params.id, req.body),
    });
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(req: Request, res: Response) {
    return OK({
      res,
      message: 'Giao dịch được xóa thành công',
      metadata: await deleteTransaction(req.params.id),
    });
  }

  /**
   * Bulk delete transactions
   */
  static async bulkDeleteTransactions(req: Request, res: Response) {
    return OK({
      res,
      message: 'Giao dịch được xóa thành công',
      metadata: await bulkDeleteTransactions(req.body.transactionIds), // body is already validated using zod in routes
    });
  }

  /**
   * Export transactions to XLSX
   */
  static async exportTransactionsToXLSX(req: Request, res: Response) {
    return OK({
      res,
      message: 'Giao dịch được xuất thành công',
      metadata: await exportTransactionsToXLSX(req.query),
    });
  }

  /**
   * Get transaction statistics
   */
  static async getTransactionStatistics(req: Request, res: Response) {
    return OK({
      res,
      message: 'Thống kê giao dịch được tải thành công',
      metadata: await getTransactionStatistics(req.query),
    });
  }
}
