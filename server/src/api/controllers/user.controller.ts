import { Request, Response } from "express";

import * as UserService from "../services/user.service";

import { OK } from "../core/success.response";

export class UserController {
  static async getUsers(req: Request, res: Response) {
    // Lấy các query params để filter
    const { status, search } = req.query;

    // Tạo query object
    const query: any = {};

    // Filter theo status nếu có
    if (status) {
      query.usr_status = status;
    }

    // Filter theo search term nếu có
    if (search) {
      query.$or = [
        { usr_username: { $regex: search, $options: "i" } },
        { usr_email: { $regex: search, $options: "i" } },
        { usr_firstName: { $regex: search, $options: "i" } },
        { usr_lastName: { $regex: search, $options: "i" } },
      ];
    }

    return OK({
      res,
      message: "Users retrieved successfully",
      metadata: await UserService.getUsers(query),
    });
  }
  static async getCurrentUser(req: Request, res: Response) {
    return OK({
      res,
      metadata: await UserService.getCurrentUser(req.user.userId),
    });
  }

  static async changePassword(req: Request, res: Response) {
    const { userId } = req.params;
    return OK({
      res,
      message: "Password changed successfully",
      metadata: await UserService.changePassword(userId, req.body),
    });
  }

  static async updateUser(req: Request, res: Response) {
    const { userId } = req.params;
    return OK({
      res,
      message: "User updated successfully",
      metadata: await UserService.updateUser(userId, req.body),
    });
  }
}
