import { Request, Response } from "express";
import * as RoleService from "../services/role.service";
import { OK } from "../core/success.response";
import { BadRequestError } from "../core/errors";

export class RoleController {
  static async getRoles(req: Request, res: Response) {
    try {
      const { status, search } = req.query;

      // Tạo query object
      const query: any = {};

      // Filter theo status nếu có
      if (status) {
        query.status = status;
      }

      // Filter theo search term nếu có
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      const roles = await RoleService.getRoles(query);

      return OK({
        res,
        message: "Roles retrieved successfully",
        metadata: roles,
      });
    } catch (error) {
      throw error;
    }
  }

  static async createRole(req: Request, res: Response) {
    try {
      // Validate input
      const { name, slug, status, description, grants } = req.body;
      if (!name || !slug || !description) {
        throw new BadRequestError("Name, slug and description are required");
      }

      // Validate grants structure if provided
      if (grants) {
        if (!Array.isArray(grants)) {
          throw new BadRequestError("Grants must be an array");
        }

        for (const grant of grants) {
          if (!grant.resourceId || !Array.isArray(grant.actions)) {
            throw new BadRequestError(
              "Each grant must have resourceId and actions array"
            );
          }
        }
      }

      const role = await RoleService.createRole(req.body);

      return OK({
        res,
        message: "Role created successfully",
        metadata: role,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getRoleById(req: Request, res: Response) {
    try {
      const { roleId } = req.params;
      const role = await RoleService.getRoleById(roleId);

      return OK({
        res,
        message: "Role retrieved successfully",
        metadata: role,
      });
    } catch (error) {
      throw error;
    }
  }

  static async updateRole(req: Request, res: Response) {
    try {
      const { roleId } = req.params;
      const role = await RoleService.updateRole(roleId, req.body);

      return OK({
        res,
        message: "Role updated successfully",
        metadata: role,
      });
    } catch (error) {
      throw error;
    }
  }

  static async deleteRole(req: Request, res: Response) {
    try {
      const { roleId } = req.params;
      const role = await RoleService.deleteRole(roleId);

      return OK({
        res,
        message: "Role deleted successfully",
        metadata: role,
      });
    } catch (error) {
      throw error;
    }
  }

  static async updateRoleGrants(req: Request, res: Response) {
    try {
      const { roleId } = req.params;
      const { grants } = req.body;

      // Validate grants
      if (!Array.isArray(grants)) {
        throw new BadRequestError("Grants must be an array");
      }

      for (const grant of grants) {
        if (!grant.resourceId || !Array.isArray(grant.actions)) {
          throw new BadRequestError(
            "Each grant must have resourceId and actions array"
          );
        }
      }

      const role = await RoleService.updateRoleGrants(roleId, grants);

      return OK({
        res,
        message: "Role grants updated successfully",
        metadata: role,
      });
    } catch (error) {
      throw error;
    }
  }
  static async addRoleGrants(req: Request, res: Response) {
    try {
      const { roleId } = req.params;
      const { grants } = req.body;

      // Validate grants
      if (!Array.isArray(grants)) {
        throw new BadRequestError("Grants must be an array");
      }

      for (const grant of grants) {
        if (!grant.resourceId || !Array.isArray(grant.actions)) {
          throw new BadRequestError(
            "Each grant must have resourceId and actions array"
          );
        }
      }

      const role = await RoleService.addRoleGrants(roleId, grants);

      return OK({
        res,
        message: "New grants added to role successfully",
        metadata: role,
      });
    } catch (error) {
      throw error;
    }
  }
  static async deleteRoleGrant(req: Request, res: Response) {
    try {
      const { roleId, resourceId } = req.params;
  
      // Validate params
      if (!roleId || !resourceId) {
        throw new BadRequestError("Role ID and Resource ID are required");
      }
  
      const role = await RoleService.deleteRoleGrant(roleId, resourceId);
  
      return OK({
        res,
        message: "Grant removed from role successfully",
        metadata: role,
      });
    } catch (error) {
      throw error;
    }
  }
}