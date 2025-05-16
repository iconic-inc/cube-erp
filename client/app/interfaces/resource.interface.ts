export interface IResource {
  _id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface IResourceResponse {
  message: string;
  metadata: IResource;
}

export interface IResourceListResponse {
  message: string;
  metadata: IResource[];
}

export interface ICreateResource {
  name: string;
  slug: string;
  description: string;
}

export interface IUpdateResource extends Partial<ICreateResource> {}
