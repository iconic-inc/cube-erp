import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import { NotFoundError, BadRequestError } from '../core/errors';
import { parse } from 'csv-parse/sync';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  deleteMultipleCustomers,
} from '@services/customer.service';

export class CustomerController {
  static async createCustomer(req: Request, res: Response) {
    // Tạo khách hàng mà không có thông tin case service
    const result = await createCustomer(req.body);
    return OK({
      res,
      message: 'Tạo khách hàng thành công',
      metadata: result,
    });
  }

  static async getCustomers(req: Request, res: Response) {
    return OK({
      res,
      message: 'Lấy danh sách khách hàng thành công',
      metadata: await getCustomers(req.query),
    });
  }

  static async getCustomerById(req: Request, res: Response) {
    const customerId = req.params.id;
    const customer = await getCustomerById(customerId);
    return OK({
      res,
      message: 'Lấy thông tin khách hàng thành công',
      metadata: customer,
    });
  }

  static async updateCustomer(req: Request, res: Response) {
    const customerId = req.params.id;
    const result = await updateCustomer(customerId, req.body);
    return OK({
      res,
      message: 'Cập nhật khách hàng thành công',
      metadata: result,
    });
  }

  static async deleteCustomer(req: Request, res: Response) {
    const customerId = req.params.id;
    const result = await deleteCustomer(customerId);
    return OK({
      res,
      message: 'Xóa khách hàng thành công',
      metadata: result,
    });
  }

  static async deleteMultipleCustomers(req: Request, res: Response) {
    const result = await deleteMultipleCustomers(req.body);
    return OK({
      res,
      message: 'Xóa nhiều khách hàng thành công',
      metadata: result,
    });
  }
}
