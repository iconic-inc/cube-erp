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
];

main();
