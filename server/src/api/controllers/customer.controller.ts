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
    // Get query params for filtering
    const {
      status,
      search,
      contactChannel,
      page = 1,
      limit = 10,
      birthMonth,
      birthDay,
      note,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Create query object
    const query: any = {};

    // Filter by status if provided
    if (status) {
      query.cus_status = status;
    }

    // Filter by contact channel if provided
    if (contactChannel) {
      query.cus_contactChannel = contactChannel;
    }

    // Filter by birth month if provided
    if (birthMonth) {
      query.$expr = {
        $eq: [{ $month: '$cus_dateOfBirth' }, parseInt(birthMonth as string)],
      };
    }

    // Filter by birth day if provided
    if (birthDay) {
      query.$expr = {
        $eq: [
          { $dayOfMonth: '$cus_dateOfBirth' },
          parseInt(birthDay as string),
        ],
      };
    }

    // Filter by note if provided
    if (note) {
      query.cus_note = { $regex: note, $options: 'i' };
    }

    // Filter by search term if provided
    if (search) {
      query.$or = [
        { cus_fullName: { $regex: search, $options: 'i' } },
        { cus_email: { $regex: search, $options: 'i' } },
        { cus_phone: { $regex: search, $options: 'i' } },
        { cus_contactAccountName: { $regex: search, $options: 'i' } },
        { cus_parentName: { $regex: search, $options: 'i' } },
      ];
    }

    // Create sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const result = await getCustomers(query, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    return OK({
      res,
      message: 'Lấy danh sách khách hàng thành công',
      metadata: result,
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
    const { customerIds } = req.body;

    if (
      !customerIds ||
      !Array.isArray(customerIds) ||
      customerIds.length === 0
    ) {
      throw new BadRequestError('Yêu cầu danh sách ID khách hàng hợp lệ');
    }

    const result = await deleteMultipleCustomers(customerIds);
    return OK({
      res,
      message: 'Xóa nhiều khách hàng thành công',
      metadata: result,
    });
  }
}
