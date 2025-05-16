import { HydratedDocument, Model, Types } from 'mongoose';

export interface IRawRole {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  description: string;
  grants: {
    resourceId: Types.ObjectId;
    actions: string[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoleAttrs {
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  description: string;
  grants: {
    resourceId: Types.ObjectId;
    actions: string[];
  }[];
}

export interface IRoleInput {
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  description: string;
  grants: {
    resourceId: Types.ObjectId;
    actions: string[];
  }[];
}

export interface IGrantInput {
  resourceId: string;
  actions: string[];
}

export type IRole = HydratedDocument<IRawRole>;

export interface IRoleModel extends Model<IRole> {
  build(attrs: IRoleAttrs): Promise<IRole>;
}
export interface IUpdateGrantInput {
  grantId: string; // ID của grant cần update
  actions: string[]; // Actions mới
}
export interface IRoleResponseData {
  id: string;
  name: string;
  slug: string;
  status: string;
  description: string;
  grants: {
    resourceId: {
      id: string;
      name: string;
      slug: string;
      description: string;
    };
    actions: string[];
  }[];
}
