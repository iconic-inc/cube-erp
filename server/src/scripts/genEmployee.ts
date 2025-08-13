require('dotenv').config();
import { mongodbInstance } from '../db/init.mongodb';
import { createEmployee } from '@services/employee.service';
import { getRoles } from '@services/role.service';
import { IEmployeeCreate } from '../api/interfaces/employee.interface';
import '@models/resource.model';
import { Types } from 'mongoose';

async function main() {
  await mongodbInstance.connect();

  console.log('Starting employee generation...');

  // First, get available roles to assign to employees
  const roles = await getRoles();

  if (roles.length === 0) {
    console.log('⚠ No roles found. Please run genRole script first.');
    await mongodbInstance.disconnect();
    return;
  }

  console.log(`Found ${roles.length} roles available`);

  // Find specific roles for assignment
  const adminRole = roles.find((role: any) => role.slug === 'admin');
  const attorneyRole = roles.find((role: any) => role.slug === 'attorney');
  const specialistRole = roles.find((role: any) => role.slug === 'specialist');

  if (!adminRole || !attorneyRole || !specialistRole) {
    console.log(
      '⚠ Required roles (admin, attorney, specialist) not found. Please ensure all roles exist.'
    );
    await mongodbInstance.disconnect();
    return;
  }

  console.log('Found required roles: admin, attorney, specialist');

  for (let i = 0; i < EMPLOYEES.length; i++) {
    const employeeData = EMPLOYEES[i];

    // Assign role based on position
    let roleId: Types.ObjectId = new Types.ObjectId(specialistRole.id); // Default role

    if (
      employeeData.position.toLowerCase().includes('giám đốc') ||
      employeeData.position.toLowerCase().includes('quản lý')
    ) {
      roleId = new Types.ObjectId(adminRole.id);
    } else if (
      employeeData.position.toLowerCase().includes('luật sư') ||
      employeeData.position.toLowerCase().includes('senior')
    ) {
      roleId = new Types.ObjectId(attorneyRole.id);
    }

    // Generate slug from first and last name
    const slug = `${employeeData.firstName
      .toLowerCase()
      .replace(/\s+/g, '-')}-${employeeData.lastName
      .toLowerCase()
      .replace(/\s+/g, '-')}`;

    const employeePayload: IEmployeeCreate = {
      ...employeeData,
      slug,
      role: roleId,
    };

    try {
      await createEmployee(employeePayload);
      console.log(
        `✓ Created employee: ${employeeData.code} - ${employeeData.firstName} ${employeeData.lastName}`
      );
    } catch (error: any) {
      if (
        error.message?.includes('already exists') ||
        error.message?.includes('đã tồn tại')
      ) {
        console.log(`⚠ Employee already exists: ${employeeData.code}`);
      } else {
        console.error(
          `✗ Error creating employee ${employeeData.code}:`,
          error.message
        );
      }
    }
  }

  console.log('Employees generated successfully!');

  await mongodbInstance.disconnect();
}

const EMPLOYEES = [
  {
    code: 'EMP001',
    firstName: 'Nguyễn Văn',
    lastName: 'Minh',
    email: 'nguyen.van.minh@iconic-law.com',
    username: 'nvminh',
    password: 'password123',
    msisdn: '0901234567',
    address: '123 Lê Lợi, Quận 1, TP.HCM',
    sex: 'male',
    birthdate: new Date('1980-03-15'),
    position: 'Giám đốc điều hành',
    department: 'Ban lãnh đạo',
    joinDate: new Date('2020-01-15'),
    status: 'active' as const,
  },
  {
    code: 'EMP002',
    firstName: 'Trần Thị',
    lastName: 'Hương',
    email: 'tran.thi.huong@iconic-law.com',
    username: 'tthuong',
    password: 'password123',
    msisdn: '0912345678',
    address: '456 Nguyễn Huệ, Quận 1, TP.HCM',
    sex: 'female',
    birthdate: new Date('1985-07-22'),
    position: 'Luật sư trưởng',
    department: 'Pháp lý doanh nghiệp',
    joinDate: new Date('2020-02-01'),
    status: 'active' as const,
  },
  {
    code: 'EMP003',
    firstName: 'Lê Minh',
    lastName: 'Tuấn',
    email: 'le.minh.tuan@iconic-law.com',
    username: 'lmtuan',
    password: 'password123',
    msisdn: '0923456789',
    address: '789 Trần Hưng Đạo, Quận 5, TP.HCM',
    sex: 'male',
    birthdate: new Date('1988-12-10'),
    position: 'Luật sư senior',
    department: 'Luật lao động',
    joinDate: new Date('2020-03-15'),
    status: 'active' as const,
  },
  {
    code: 'EMP004',
    firstName: 'Phạm Thị',
    lastName: 'Lan',
    email: 'pham.thi.lan@iconic-law.com',
    username: 'ptlan',
    password: 'password123',
    msisdn: '0934567890',
    address: '321 Võ Văn Tần, Quận 3, TP.HCM',
    sex: 'female',
    birthdate: new Date('1990-05-18'),
    position: 'Luật sư',
    department: 'Luật doanh nghiệp',
    joinDate: new Date('2021-01-10'),
    status: 'active' as const,
  },
  {
    code: 'EMP005',
    firstName: 'Hoàng Văn',
    lastName: 'Nam',
    email: 'hoang.van.nam@iconic-law.com',
    username: 'hvnam',
    password: 'password123',
    msisdn: '0945678901',
    address: '654 Lý Tự Trọng, Quận 1, TP.HCM',
    sex: 'male',
    birthdate: new Date('1987-09-25'),
    position: 'Chuyên viên pháp lý',
    department: 'Tư vấn pháp lý',
    joinDate: new Date('2021-06-01'),
    status: 'active' as const,
  },
  {
    code: 'EMP006',
    firstName: 'Võ Thị',
    lastName: 'Mai',
    email: 'vo.thi.mai@iconic-law.com',
    username: 'vtmai',
    password: 'password123',
    msisdn: '0956789012',
    address: '987 Hai Bà Trưng, Quận 1, TP.HCM',
    sex: 'female',
    birthdate: new Date('1992-11-30'),
    position: 'Trợ lý luật sư',
    department: 'Hỗ trợ pháp lý',
    joinDate: new Date('2022-01-15'),
    status: 'active' as const,
  },
  {
    code: 'EMP007',
    firstName: 'Đặng Minh',
    lastName: 'Quang',
    email: 'dang.minh.quang@iconic-law.com',
    username: 'dmquang',
    password: 'password123',
    msisdn: '0967890123',
    address: '147 Pasteur, Quận 1, TP.HCM',
    sex: 'male',
    birthdate: new Date('1989-04-12'),
    position: 'Quản lý Nhân viên',
    department: 'Hành chính Nhân viên',
    joinDate: new Date('2020-08-01'),
    status: 'active' as const,
  },
  {
    code: 'EMP008',
    firstName: 'Bùi Thị',
    lastName: 'Ngọc',
    email: 'bui.thi.ngoc@iconic-law.com',
    username: 'btngoc',
    password: 'password123',
    msisdn: '0978901234',
    address: '258 Cách Mạng Tháng 8, Quận 10, TP.HCM',
    sex: 'female',
    birthdate: new Date('1991-08-08'),
    position: 'Kế toán trưởng',
    department: 'Tài chính kế toán',
    joinDate: new Date('2020-09-15'),
    status: 'active' as const,
  },
  {
    code: 'EMP009',
    firstName: 'Lý Văn',
    lastName: 'Đức',
    email: 'ly.van.duc@iconic-law.com',
    username: 'lvduc',
    password: 'password123',
    msisdn: '0989012345',
    address: '369 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
    sex: 'male',
    birthdate: new Date('1986-01-20'),
    position: 'Chuyên viên IT',
    department: 'Công nghệ thông tin',
    joinDate: new Date('2021-03-01'),
    status: 'active' as const,
  },
  {
    code: 'EMP010',
    firstName: 'Đỗ Thị',
    lastName: 'Thu',
    email: 'do.thi.thu@iconic-law.com',
    username: 'dtthu',
    password: 'password123',
    msisdn: '0990123456',
    address: '741 Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
    sex: 'female',
    birthdate: new Date('1993-06-14'),
    position: 'Thư ký',
    department: 'Hành chính',
    joinDate: new Date('2022-05-10'),
    status: 'active' as const,
  },
  {
    code: 'EMP011',
    firstName: 'Vũ Minh',
    lastName: 'Hải',
    email: 'vu.minh.hai@iconic-law.com',
    username: 'vmhai',
    password: 'password123',
    msisdn: '0901234560',
    address: '852 Cộng Hòa, Quận Tân Bình, TP.HCM',
    sex: 'male',
    birthdate: new Date('1984-10-05'),
    position: 'Luật sư senior',
    department: 'Luật hình sự',
    joinDate: new Date('2020-11-01'),
    status: 'active' as const,
  },
  {
    code: 'EMP012',
    firstName: 'Mai Thị',
    lastName: 'Hoa',
    email: 'mai.thi.hoa@iconic-law.com',
    username: 'mthoa',
    password: 'password123',
    msisdn: '0912345670',
    address: '963 Lạc Long Quân, Quận 11, TP.HCM',
    sex: 'female',
    birthdate: new Date('1989-02-28'),
    position: 'Chuyên viên marketing',
    department: 'Marketing',
    joinDate: new Date('2021-08-15'),
    status: 'active' as const,
  },
  {
    code: 'EMP013',
    firstName: 'Ngô Văn',
    lastName: 'Long',
    email: 'ngo.van.long@iconic-law.com',
    username: 'nvlong',
    password: 'password123',
    msisdn: '0923456780',
    address: '174 Hoàng Văn Thụ, Quận Phú Nhuận, TP.HCM',
    sex: 'male',
    birthdate: new Date('1991-12-03'),
    position: 'Luật sự',
    department: 'Luật bất động sản',
    joinDate: new Date('2022-02-01'),
    status: 'active' as const,
  },
  {
    code: 'EMP014',
    firstName: 'Hồ Thị',
    lastName: 'Linh',
    email: 'ho.thi.linh@iconic-law.com',
    username: 'htlinh',
    password: 'password123',
    msisdn: '0934567801',
    address: '285 Xô Viết Nghệ Tĩnh, Quận Bình Thạnh, TP.HCM',
    sex: 'female',
    birthdate: new Date('1990-08-16'),
    position: 'Trợ lý nghiên cứu',
    department: 'Nghiên cứu pháp lý',
    joinDate: new Date('2022-09-01'),
    status: 'active' as const,
  },
  {
    code: 'EMP015',
    firstName: 'Chu Minh',
    lastName: 'Sơn',
    email: 'chu.minh.son@iconic-law.com',
    username: 'cmson',
    password: 'password123',
    msisdn: '0945678912',
    address: '396 Nguyễn Kiệm, Quận Gò Vấp, TP.HCM',
    sex: 'male',
    birthdate: new Date('1988-05-09'),
    position: 'Chuyên viên dịch thuật',
    department: 'Dịch vụ hỗ trợ',
    joinDate: new Date('2021-11-15'),
    status: 'active' as const,
  },
];

main().catch((error) => {
  console.error('Script execution failed:', error);
  process.exit(1);
});
