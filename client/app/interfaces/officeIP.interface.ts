export interface IOfficeIPBrief {
  id: string;
  officeName: string;
  ipAddress: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOfficeIP extends IOfficeIPBrief {}

export interface IOfficeIPCreate {
  officeName: string;
  ipAddress: string;
}
