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
    name: 'Notification Management',
    slug: 'notification',
    description: 'Quản lý thông báo',
  },
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
    name: 'Page Management',
    slug: 'page',
    description: 'Quản lý trang',
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
    name: 'Category Management',
    slug: 'category',
    description: 'Quản lý danh mục',
  },
  {
    name: 'Branch Management',
    slug: 'branch',
    description: 'Quản lý chi nhánh',
  },
  {
    name: 'Booking Management',
    slug: 'booking',
    description: 'Quản lý đặt lịch',
  },
  {
    _id: '67d29e626f885210e0329c83',
    name: 'App Management',
    slug: 'app',
    description: 'Quản lý ứng dụng',
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
    name: 'Spa Management',
    slug: 'spa',
    description: 'Quản lý spa',
  },
  {
    name: 'Review Management',
    slug: 'review',
    description: 'Quản lý đánh giá',
  },
];

main();
