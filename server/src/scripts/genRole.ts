require('dotenv').config();
import { RoleModel } from '@models/role.model';
import { mongodbInstance } from '../db/init.mongodb';
import { ResourceModel } from '@models/resource.model';
import { removeNestedNullish } from '@utils/index';

async function main() {
  await mongodbInstance.connect();

  for (const { name, slug, description, grants, status } of Object.values(
    ROLES
  )) {
    const formatedGrants = await Promise.all(
      grants.map(async (grant) => {
        const resrc = await ResourceModel.findOne({
          slug: grant.resourceId.slug,
        });
        if (!resrc) return null;

        return { resourceId: resrc.id, actions: grant.actions };
      })
    );

    await RoleModel.build({
      name,
      slug,
      description,
      status: status as 'active',
      grants: removeNestedNullish(formatedGrants),
    });
  }

  console.log('Roles generated successfully!');

  await mongodbInstance.disconnect();
}

const ROLES = [
  {
    name: 'Administrator',
    slug: 'admin',
    status: 'active',
    description: 'Quản trị hệ thống',
    grants: [
      {
        resourceId: { slug: 'notification' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'resource' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'template' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'role' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'page' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'otp' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'keyToken' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'image' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'category' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'branch' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'booking' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'app' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'apiKey' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'user' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'review' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'spa' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
    ],
  },

  {
    name: 'Spa Owner',
    slug: 'spa-owner',
    status: 'active',
    description: 'Chủ / quản lý spa',
    grants: [
      {
        resourceId: { slug: 'notification' },
        actions: ['create:any', 'read:own', 'update:own', 'delete:own'],
      },
      { resourceId: { slug: 'page' }, actions: ['read:any'] },
      {
        resourceId: { slug: 'image' },
        actions: ['create:any', 'read:any', 'update:own', 'delete:own'],
      },
      { resourceId: { slug: 'category' }, actions: ['read:any'] },
      { resourceId: { slug: 'branch' }, actions: ['read:any'] },
      {
        resourceId: { slug: 'booking' },
        actions: ['read:own', 'update:own', 'delete:own'],
      },
      { resourceId: { slug: 'app' }, actions: ['read:any'] },
      { resourceId: { slug: 'user' }, actions: ['read:own', 'update:own'] },
      {
        resourceId: { slug: 'review' },
        actions: ['create:own', 'read:any', 'update:own', 'delete:own'],
      },
      {
        resourceId: { slug: 'spa' },
        actions: ['create:own', 'read:any', 'update:own', 'delete:own'],
      },
    ],
  },

  {
    name: 'Client',
    slug: 'client',
    status: 'active',
    description: 'Khách hàng cuối',
    grants: [
      {
        resourceId: { slug: 'notification' },
        actions: ['create:own', 'read:own', 'update:own', 'delete:own'],
      },
      { resourceId: { slug: 'page' }, actions: ['read:any'] },
      { resourceId: { slug: 'otp' }, actions: ['create:any'] },
      { resourceId: { slug: 'image' }, actions: ['read:any'] },
      { resourceId: { slug: 'category' }, actions: ['read:any'] },
      { resourceId: { slug: 'branch' }, actions: ['read:any'] },
      {
        resourceId: { slug: 'booking' },
        actions: ['create:any', 'read:own', 'delete:own'],
      },
      { resourceId: { slug: 'app' }, actions: ['read:any'] },
      { resourceId: { slug: 'user' }, actions: ['read:own', 'delete:own'] },
      {
        resourceId: { slug: 'review' },
        actions: ['create:own', 'read:any', 'update:own', 'delete:own'],
      },
      { resourceId: { slug: 'spa' }, actions: ['read:any'] },
    ],
  },
];

main();
