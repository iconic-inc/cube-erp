import { ISessionUser } from "~/interfaces/auth.interface";
import { fetcher } from ".";
import {
  IResourceResponse,
  IResourceListResponse,
  ICreateResource,
  IUpdateResource,
} from "~/interfaces/resource.interface";

// Lấy danh sách resources
const getResources = async (request: ISessionUser) => {
  const response = await fetcher("/resources", { request });
  return response as IResourceListResponse;
};

// Lấy thông tin một resource
const getResourceById = async (id: string, request: ISessionUser) => {
  const response = await fetcher(`/resources/${id}`, { request });
  return response as IResourceResponse;
};

// Tạo resource mới
const createResource = async (data: ICreateResource, request: ISessionUser) => {
  const response = await fetcher("/resources", {
    method: "POST",
    body: JSON.stringify(data),
    request,
  });
  return response as IResourceResponse;
};

// Cập nhật resource
const updateResource = async (
  id: string,
  data: IUpdateResource,
  request: ISessionUser
) => {
  const response = await fetcher(`/resources/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    request,
  });
  return response as IResourceResponse;
};

// Xóa resource
const deleteResource = async (id: string, request: ISessionUser) => {
  const response = await fetcher(`/resources/${id}`, {
    method: "DELETE",
    request,
  });
  return response as { message: string; metadata: { success: boolean } };
};

export {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
};
