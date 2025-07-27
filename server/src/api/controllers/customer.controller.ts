import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  deleteMultipleCustomers,
  exportCustomersToXLSX,
  importCustomersFromXLSX,
} from '@services/customer.service';
import { BadRequestError } from '../core/errors';

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

  static async exportCustomersToXLSX(req: Request, res: Response) {
    // Implement the logic to export customers to a file format (e.g., CSV, XLSX)
    // This is a placeholder for the actual implementation
    return OK({
      res,
      message: 'Export customers functionality not implemented yet',
      metadata: await exportCustomersToXLSX(req.query),
    });
  }

  static async importCustomersFromXLSX(req: Request, res: Response) {
    // Get file path from uploaded file
    const filePath = req.file?.path;

    if (!filePath) {
      throw new BadRequestError('Vui lòng chọn file Excel để import');
    }

    // Get import options from request body
    const options = {
      skipDuplicates:
        req.body.skipDuplicates === 'true' || req.body.skipDuplicates === true,
      updateExisting:
        req.body.updateExisting === 'true' || req.body.updateExisting === true,
      skipEmptyRows:
        req.body.skipEmptyRows === 'true' || req.body.skipEmptyRows === true,
    };

    const result = await importCustomersFromXLSX(filePath, options);

    return OK({
      res,
      message: 'Customers imported successfully',
      metadata: result,
    });
  }
}
