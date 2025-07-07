import { TaskTemplateModel } from '@models/taskTemplate.model';
import { getReturnData, getReturnList } from '@utils/index';
import { BadRequestError, NotFoundError } from '../core/errors';
import { isValidObjectId } from 'mongoose';
import { ITaskTemplateCreate } from '../interfaces/taskTemplate.interface';

const getTaskTemplates = async () => {
  const taskTemplates = await TaskTemplateModel.find();
  if (!taskTemplates || taskTemplates.length === 0) {
    throw new NotFoundError('No task templates found');
  }

  return getReturnList(taskTemplates);
};

const getTaskTEmplateById = async (id: string) => {
  if (!isValidObjectId(id)) {
    throw new BadRequestError('Invalid request.');
  }
  const taskTemplate = await TaskTemplateModel.findById(id);
  if (!taskTemplate) {
    throw new NotFoundError(`Task template with ID ${id} not found`);
  }
  return getReturnData(taskTemplate);
};

const getTaskTemplateByKey = async (key: string) => {
  if (!key) {
    throw new BadRequestError('Key is required.');
  }
  const taskTemplate = await TaskTemplateModel.findOne({ tpl_key: key });
  if (!taskTemplate) {
    throw new NotFoundError(`Task template with key ${key} not found`);
  }
  return getReturnData(taskTemplate);
};

const createTaskTemplate = async (data: ITaskTemplateCreate) => {
  if (!data.name || !data.key || !data.steps || data.steps.length === 0) {
    throw new BadRequestError('Name, key, and steps are required.');
  }
  const taskTemplate = await TaskTemplateModel.build(data);
  return getReturnData(taskTemplate);
};

const updateTaskTemplate = async (
  id: string,
  data: Partial<ITaskTemplateCreate>
) => {
  if (!isValidObjectId(id)) {
    throw new BadRequestError('Invalid request.');
  }
  const taskTemplate = await TaskTemplateModel.findByIdAndUpdate(id, data, {
    new: true,
  });
  if (!taskTemplate) {
    throw new NotFoundError(`Task template with ID ${id} not found`);
  }
  return getReturnData(taskTemplate);
};

const deleteTaskTemplate = async (id: string) => {
  if (!isValidObjectId(id)) {
    throw new BadRequestError('Invalid request.');
  }
  const taskTemplate = await TaskTemplateModel.findByIdAndDelete(id);
  if (!taskTemplate) {
    throw new NotFoundError(`Task template with ID ${id} not found`);
  }
  return getReturnData(taskTemplate);
};

export {
  getTaskTemplates,
  getTaskTEmplateById,
  getTaskTemplateByKey,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
};
