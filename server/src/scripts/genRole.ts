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

// Base permissions shared by all employees
const BASE_EMPLOYEE_GRANTS = [
  { resourceId: { slug: 'officeIP' }, actions: ['read:any'] },
  {
    resourceId: { slug: 'keyToken' },
    actions: ['create:own', 'read:own', 'update:own', 'delete:own'],
  },
  { resourceId: { slug: 'user' }, actions: ['read:own', 'update:own'] },
  { resourceId: { slug: 'employee' }, actions: ['read:any', 'update:own'] },
  {
    resourceId: { slug: 'attendance' },
    actions: ['create:own', 'read:own', 'update:own'],
  },
  {
    resourceId: { slug: 'image' },
    actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
  },
  { resourceId: { slug: 'reward' }, actions: ['read:any'] },
  {
    resourceId: { slug: 'document' },
    actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
  },
  {
    resourceId: { slug: 'documentFolder' },
    actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
  },
];

const ROLES = [
  {
    name: 'Quản trị hệ thống',
    slug: 'admin',
    status: 'active',
    description: 'Quản trị hệ thống',
    grants: [
      'resource',
      'template',
      'role',
      'otp',
      'apiKey',
      'keyToken',
      'image',
      'user',
      'officeIP',
      'employee',
      'attendance',
      'caseService',
      'customer',
      'task',
      'transaction',
      'document',
      'documentFolder',
      'reward',
    ].map((resource) => ({
      resourceId: { slug: resource },
      actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
    })),
  },
  {
    name: 'Luật sư',
    slug: 'attorney',
    status: 'active',
    description: 'Luật sư',
    grants: [
      ...BASE_EMPLOYEE_GRANTS,
      // Case management - attorneys can handle cases but not delete them
      {
        resourceId: { slug: 'caseService' },
        actions: ['create:any', 'read:any', 'update:any'],
      },
      // Customer management - can create/update but not delete
      {
        resourceId: { slug: 'customer' },
        actions: ['create:any', 'read:any', 'update:any'],
      },
      // Tasks - only own tasks
      {
        resourceId: { slug: 'task' },
        actions: ['create:own', 'read:own', 'update:own', 'delete:own'],
      },
      // Read access to transactions for case billing
      {
        resourceId: { slug: 'transaction' },
        actions: ['read:any'],
      },
    ],
  },
  {
    name: 'Chuyên viên',
    slug: 'specialist',
    status: 'active',
    description: 'Chuyên viên',
    grants: [
      ...BASE_EMPLOYEE_GRANTS,
      // Support role - limited case access
      {
        resourceId: { slug: 'caseService' },
        actions: ['read:any', 'update:any'],
      },
      // Customer support
      {
        resourceId: { slug: 'customer' },
        actions: ['read:any', 'update:any'],
      },
      // Own tasks only
      {
        resourceId: { slug: 'task' },
        actions: ['create:own', 'read:own', 'update:own', 'delete:own'],
      },
    ],
  },
  {
    name: 'Kế toán',
    slug: 'accountant',
    status: 'active',
    description: 'Kế toán',
    grants: [
      ...BASE_EMPLOYEE_GRANTS,
      // Read-only case access for billing
      {
        resourceId: { slug: 'caseService' },
        actions: ['read:any'],
      },
      // Customer billing info
      {
        resourceId: { slug: 'customer' },
        actions: ['read:any', 'update:any'],
      },
      // Own tasks
      {
        resourceId: { slug: 'task' },
        actions: ['create:own', 'read:own', 'update:own', 'delete:own'],
      },
      // Full transaction access
      {
        resourceId: { slug: 'transaction' },
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
    ],
  },
  {
    name: 'Thực tập sinh',
    slug: 'intern',
    status: 'active',
    description: 'Thực tập sinh',
    grants: [
      ...BASE_EMPLOYEE_GRANTS,
      // Support role - limited case access
      {
        resourceId: { slug: 'caseService' },
        actions: ['read:any', 'update:any'],
      },
      // Customer support
      {
        resourceId: { slug: 'customer' },
        actions: ['read:any', 'update:any'],
      },
      // Own tasks only
      {
        resourceId: { slug: 'task' },
        actions: ['create:own', 'read:own', 'update:own', 'delete:own'],
      },
    ],
  },
  {
    name: 'Cộng tác viên',
    slug: 'collaborator',
    status: 'active',
    description: 'Cộng tác viên',
    grants: [
      ...BASE_EMPLOYEE_GRANTS,
      // Support role - limited case access
      {
        resourceId: { slug: 'caseService' },
        actions: ['read:any', 'update:any'],
      },
      // Customer support
      {
        resourceId: { slug: 'customer' },
        actions: ['read:any', 'update:any'],
      },
      // Own tasks only
      {
        resourceId: { slug: 'task' },
        actions: ['create:own', 'read:own', 'update:own', 'delete:own'],
      },
    ],
  },
  {
    name: 'Truyền thông',
    slug: 'communication',
    status: 'active',
    description: 'Truyền thông',
    grants: [
      ...BASE_EMPLOYEE_GRANTS,
      // Support role - limited case access
      {
        resourceId: { slug: 'caseService' },
        actions: ['read:any', 'update:any'],
      },
      // Customer support
      {
        resourceId: { slug: 'customer' },
        actions: ['read:any', 'update:any'],
      },
      // Own tasks only
      {
        resourceId: { slug: 'task' },
        actions: ['create:own', 'read:own', 'update:own', 'delete:own'],
      },
    ],
  },
];

main();
