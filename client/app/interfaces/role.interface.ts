export interface IResource {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface IGrant {
  resourceId: IResource;
  actions: string[];
}

export interface IRole {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  description: string;
  grants: IGrant[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface ICreateRole {
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  description: string;
  grants: {
    resourceId: string;
    actions: string[];
  }[];
}

export interface IUpdateRole extends Partial<ICreateRole> {
  status?: 'active' | 'inactive';
}
