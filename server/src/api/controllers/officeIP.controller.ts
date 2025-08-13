import { Request, Response } from 'express';
import { OK } from '../core/success.response';
import * as officeIPService from '../services/officeIP.service';

export class OfficeIPController {
  static async getAllOfficeIPs(req: Request, res: Response) {
    const result = await officeIPService.getAllOfficeIPAddresses();
    return OK({
      res,
      message: 'Successfully fetched all office IP addresses',
      metadata: result,
    });
  }
  static async getOfficeIPById(req: Request, res: Response) {
    const result = await officeIPService.getOfficeIPAddressById(req.params.id);
    return OK({
      res,
      message: 'Successfully fetched office IP address',
      metadata: result,
    });
  }
  static async createOfficeIP(req: Request, res: Response) {
    const result = await officeIPService.createOfficeIPAddress(req.body);
    return OK({
      res,
      message: 'Successfully created office IP address',
      metadata: result,
    });
  }
  static async updateOfficeIP(req: Request, res: Response) {
    const result = await officeIPService.updateOfficeIPAddress(
      req.params.id,
      req.body
    );
    return OK({
      res,
      message: 'Successfully updated office IP address',
      metadata: result,
    });
  }
  static async deleteOfficeIP(req: Request, res: Response) {
    const result = await officeIPService.deleteOfficeIPAddress(req.params.id);
    return OK({
      res,
      message: 'Successfully deleted office IP address',
      metadata: result,
    });
  }
}
