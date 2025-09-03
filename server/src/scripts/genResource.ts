require('dotenv').config();
import { mongodbInstance } from '../db/init.mongodb';
import { ResourceModel } from '@models/resource.model';

async function main() {
  await mongodbInstance.connect();

  for (const { name, slug, description } of Object.values(RESOURCES)) {
    await ResourceModel.build({
      name,
      slug,
      description,
    });
  }

  console.log('Resources generated successfully!');

  await mongodbInstance.disconnect();
}

const RESOURCES = [
  {
    name: 'Resource Management',
    slug: 'resource',
    description: 'Quản lý tài nguyên',
  },
  {
    name: 'Template Management',
    slug: 'template',
    description: 'Quản lý mẫu',
  },
  {
    name: 'Role Management',
    slug: 'role',
    description: 'Quản lý vai trò',
  },
  {
    name: 'OTP Management',
    slug: 'otp',
    description: 'Quản lý OTP',
  },
  {
    name: 'Key Token Management',
    slug: 'keyToken',
    description: 'Quản lý token',
  },
  {
    name: 'Image Management',
    slug: 'image',
    description: 'Quản lý hình ảnh',
  },
  {
    name: 'API Key Management',
    slug: 'apiKey',
    description: 'Quản lý khóa API',
  },
  {
    name: 'User Management',
    slug: 'user',
    description: 'Quản lý người dùng hệ thống',
  },
  {
    name: 'Office IP Management',
    slug: 'officeIP',
    description: 'Quản lý IP văn phòng',
  },
  {
    name: 'Employee Management',
    slug: 'employee',
    description: 'Quản lý nhân viên',
  },
  {
    name: 'Attendance Management',
    slug: 'attendance',
    description: 'Quản lý điểm danh',
  },
  {
    name: 'Case Service Management',
    slug: 'caseService',
    description: 'Quản lý dịch vụ vụ án',
  },
  {
    name: 'Customer Management',
    slug: 'customer',
    description: 'Quản lý khách hàng',
  },
  {
    name: 'Task Management',
    slug: 'task',
    description: 'Quản lý công việc',
  },
  {
    name: 'Transaction Management',
    slug: 'transaction',
    description: 'Quản lý giao dịch',
  },
  {
    name: 'Document Management',
    slug: 'document',
    description: 'Quản lý tài liệu',
  },
  {
    name: 'Document Folder Management',
    slug: 'documentFolder',
    description: 'Quản lý thư mục tài liệu',
  },
  {
    name: 'Reward Management',
    slug: 'reward',
    description: 'Quản lý quỹ thưởng',
  },
];

main();
