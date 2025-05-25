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
      'resource',
      'template',
      'role',
      'otp',
      'apiKey',
      'officeIP',
      'keyToken',
      'image',
      'user',
      'employee',
      'attendance',
      'caseService',
      'customer',
      'task',
      'invoice',
      'document',
    ].map((resource) => ({
      resourceId: { slug: resource },
      actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
    })),
  },
  {
    name: 'Attorney',
    slug: 'attorney',
    status: 'active',
    description: 'Luật sư',
    grants: [
      { resourceId: { slug: 'officeIP' }, actions: ['read:any'] },
      {
        resourceId: { slug: 'keyToken' },
        actions: ['create:own', 'read:own', 'update:own', 'delete:own'],
      },
      {
        resourceId: { slug: 'image' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      { resourceId: { slug: 'user' }, actions: ['read:own', 'update:own'] },
      { resourceId: { slug: 'employee' }, actions: ['read:own', 'update:own'] },
      {
        resourceId: { slug: 'attendance' },
        actions: ['create:own', 'read:own', 'update:own'],
      },
      {
        resourceId: { slug: 'caseService' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'customer' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'task' },
        actions: ['create:own', 'read:own', 'update:own', 'delete:own'],
      },
      {
        resourceId: { slug: 'invoice' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'document' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
    ],
  },
  {
    name: 'Specialist',
    slug: 'specialist',
    status: 'active',
    description: 'Chuyên viên',
    grants: [
      { resourceId: { slug: 'officeIP' }, actions: ['read:any'] },
      { resourceId: { slug: 'keyToken' }, actions: ['read:own'] },
      {
        resourceId: { slug: 'image' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      { resourceId: { slug: 'user' }, actions: ['read:own', 'update:own'] },
      { resourceId: { slug: 'employee' }, actions: ['read:own', 'update:own'] },
      {
        resourceId: { slug: 'attendance' },
        actions: ['create:own', 'read:own', 'update:own'],
      },
      {
        resourceId: { slug: 'caseService' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'customer' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'task' },
        actions: ['create:own', 'read:own', 'update:own', 'delete:own'],
      },
      {
        resourceId: { slug: 'invoice' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      {
        resourceId: { slug: 'document' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
    ],
  },
];

main();
