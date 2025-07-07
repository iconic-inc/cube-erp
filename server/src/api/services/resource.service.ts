import { NotFoundError } from '../core/errors';
import { ResourceModel } from '../models/resource.model';
import { IResourceInput } from '../interfaces/resource.interface';
import { getReturnData, getReturnList } from '@utils/index';
import { isValidObjectId } from 'mongoose';

const getResources = async (query: any = {}) => {
  try {
    const resources = await ResourceModel.find(
      query,
      'name slug description'
    ).sort({ createdAt: -1 });
    return getReturnList(resources);
  } catch (error) {
    throw error;
  }
};

const createResource = async (resourceData: IResourceInput) => {
  try {
    // Tạo instance mới
    const newResource = new ResourceModel(resourceData);
    // Lưu vào database
    const savedResource = await newResource.save();
    return getReturnData(savedResource);
  } catch (error) {
    throw error;
  }
};

const getResourceById = async (resourceId: string) => {
  try {
    const resource = await ResourceModel.findOne(
      isValidObjectId(resourceId) ? { _id: resourceId } : { slug: resourceId }
    );
    if (!resource) throw new NotFoundError('Resource not found');
    return getReturnData(resource);
  } catch (error) {
    throw error;
  }
};

const updateResource = async (
  resourceId: string,
  resourceData: Partial<IResourceInput>
) => {
  try {
    const resource = await ResourceModel.findByIdAndUpdate(
      resourceId,
      resourceData,
      { new: true }
    );
    if (!resource) throw new NotFoundError('Resource not found');
    return getReturnData(resource);
  } catch (error) {
    throw error;
  }
};

const deleteResource = async (resourceId: string) => {
  try {
    const resource = await ResourceModel.findByIdAndDelete(resourceId);
    if (!resource) throw new NotFoundError('Resource not found');
    return getReturnData(resource);
  } catch (error) {
    throw error;
  }
};

export {
  getResources,
  createResource,
  getResourceById,
  updateResource,
  deleteResource,
};
