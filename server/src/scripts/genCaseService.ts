require('dotenv').config();
import { mongodbInstance } from '../db/init.mongodb';
import { CASE_SERVICE } from '@constants/caseService.constant';
import { createCaseService } from '@services/caseService.service';
import { getCustomers } from '@services/customer.service';
import { getEmployees } from '@services/employee.service';

async function main() {
  await mongodbInstance.connect();

  console.log('Starting case service generation...');

  // First, get existing customers and employees using service methods
  const [customersResult, employeesResult] = await Promise.all([
    getCustomers({ limit: 1000 }), // Get up to 1000 customers
    getEmployees({ limit: 1000 }), // Get up to 1000 employees
  ]);

  const customers = customersResult.data;
  const employees = employeesResult.data;

  if (customers.length === 0) {
    console.log('⚠ No customers found. Please run genCustomer script first.');
    await mongodbInstance.disconnect();
    return;
  }

  if (employees.length === 0) {
    console.log('⚠ No employees found. Please create some employees first.');
    await mongodbInstance.disconnect();
    return;
  }

  console.log(
    `Found ${customers.length} customers and ${employees.length} employees`
  );

  // Filter attorneys and specialists for lead attorney roles
  const attorneys = employees.filter(
    (emp: any) =>
      emp.emp_position?.toLowerCase().includes('luật sư') ||
      emp.emp_position?.toLowerCase().includes('attorney') ||
      emp.emp_position?.toLowerCase().includes('senior')
  );

  const leadAttorneys =
    attorneys.length > 0
      ? attorneys
      : employees.slice(0, Math.min(3, employees.length));

  console.log(
    `Using ${leadAttorneys.length} employees as potential lead attorneys`
  );

  for (let i = 0; i < CASE_SERVICES.length; i++) {
    const caseData = CASE_SERVICES[i];

    // Assign random customer (use customers in order if we have enough, otherwise cycle)
    const customer = customers[i % customers.length];

    // Assign random lead attorney
    const leadAttorney = leadAttorneys[i % leadAttorneys.length];

    // Assign 1-3 random assignees (excluding lead attorney)
    const availableAssignees = employees.filter(
      (emp: any) => emp.id !== leadAttorney.id
    );
    const numAssignees = Math.floor(Math.random() * 3) + 1; // 1-3 assignees
    const assignees: string[] = [];

    for (
      let j = 0;
      j < Math.min(numAssignees, availableAssignees.length);
      j++
    ) {
      const randomIndex = Math.floor(Math.random() * availableAssignees.length);
      const assignee = availableAssignees.splice(randomIndex, 1)[0];
      if (assignee?.id) {
        assignees.push(assignee.id);
      }
    }

    const caseServiceData = {
      ...caseData,
      customer: customer.id as string,
      leadAttorney: leadAttorney.id as string,
      assignees: assignees,
    };

    try {
      await createCaseService(caseServiceData);
      console.log(
        `✓ Created case service: ${caseData.code} for customer ${customer.cus_code}`
      );
    } catch (error: any) {
      if (error.message?.includes('đã tồn tại')) {
        console.log(`⚠ Case service already exists: ${caseData.code}`);
      } else {
        console.error(
          `✗ Error creating case service ${caseData.code}:`,
          error.message
        );
      }
    }
  }

  console.log('Case services generated successfully!');

  await mongodbInstance.disconnect();
}

const CASE_SERVICES = [
  {
    code: 'CASE001',
    notes:
      'Tư vấn thành lập công ty TNHH, bao gồm soạn thảo hồ sơ và hướng dẫn thủ tục',
    status: CASE_SERVICE.STATUS.IN_PROGRESS,
    startDate: new Date('2024-12-01'),
  },
  {
    code: 'CASE002',
    notes:
      'Tư vấn luật lao động cho doanh nghiệp, xây dựng quy chế nội bộ và hợp đồng lao động',
    status: CASE_SERVICE.STATUS.OPEN,
    startDate: new Date('2024-12-15'),
  },
  {
    code: 'CASE003',
    notes:
      'Hỗ trợ pháp lý cho startup công nghệ, bảo vệ sở hữu trí tuệ và soạn thảo hợp đồng đầu tư',
    status: CASE_SERVICE.STATUS.IN_PROGRESS,
    startDate: new Date('2024-11-20'),
  },
  {
    code: 'CASE004',
    notes:
      'Tư vấn thuế doanh nghiệp và kế toán pháp lý cho công ty mới thành lập',
    status: CASE_SERVICE.STATUS.COMPLETED,
    startDate: new Date('2024-10-05'),
    endDate: new Date('2024-12-20'),
  },
  {
    code: 'CASE005',
    notes: 'Soạn thảo và đàm phán hợp đồng franchising cho chuỗi nhà hàng',
    status: CASE_SERVICE.STATUS.IN_PROGRESS,
    startDate: new Date('2024-11-10'),
  },
  {
    code: 'CASE006',
    notes:
      'Tư vấn luật thương mại điện tử và bảo vệ dữ liệu cá nhân cho nền tảng e-commerce',
    status: CASE_SERVICE.STATUS.OPEN,
    startDate: new Date('2025-01-02'),
  },
  {
    code: 'CASE007',
    notes:
      'Hỗ trợ pháp lý cho hoạt động nhập khẩu, giải quyết vấn đề hải quan và thương mại',
    status: CASE_SERVICE.STATUS.IN_PROGRESS,
    startDate: new Date('2024-12-10'),
  },
  {
    code: 'CASE008',
    notes:
      'Tư vấn luật đất đai và bất động sản, hỗ trợ thủ tục chuyển nhượng quyền sử dụng đất',
    status: CASE_SERVICE.STATUS.OPEN,
    startDate: new Date('2024-12-25'),
  },
  {
    code: 'CASE009',
    notes:
      'Tư vấn giấy phép kinh doanh cho spa và thẩm mỹ viện, tuân thủ quy định y tế',
    status: CASE_SERVICE.STATUS.COMPLETED,
    startDate: new Date('2024-09-15'),
    endDate: new Date('2024-11-30'),
  },
  {
    code: 'CASE010',
    notes:
      'Soạn thảo hợp đồng dịch vụ freelance và bảo vệ quyền lợi cho chuyên gia IT',
    status: CASE_SERVICE.STATUS.IN_PROGRESS,
    startDate: new Date('2024-12-05'),
  },
  {
    code: 'CASE011',
    notes:
      'Tư vấn luật giáo dục và thành lập trung tâm đào tạo, giấy phép hoạt động giáo dục',
    status: CASE_SERVICE.STATUS.OPEN,
    startDate: new Date('2024-12-28'),
  },
  {
    code: 'CASE012',
    notes:
      'Hỗ trợ pháp lý cho chính sách HR và quy định lao động mới trong doanh nghiệp',
    status: CASE_SERVICE.STATUS.IN_PROGRESS,
    startDate: new Date('2024-11-25'),
  },
  {
    code: 'CASE013',
    notes:
      'Tư vấn luật doanh nghiệp và tái cấu trúc tổ chức cho công ty gia đình',
    status: CASE_SERVICE.STATUS.COMPLETED,
    startDate: new Date('2024-08-20'),
    endDate: new Date('2024-11-15'),
  },
  {
    code: 'CASE014',
    notes:
      'Hỗ trợ pháp lý cho hoạt động tư vấn luật, giấy phép hành nghề và quy định nghề nghiệp',
    status: CASE_SERVICE.STATUS.OPEN,
    startDate: new Date('2025-01-05'),
  },
  {
    code: 'CASE015',
    notes: 'Tư vấn hợp đồng M&A và thương vụ sáp nhập doanh nghiệp',
    status: CASE_SERVICE.STATUS.IN_PROGRESS,
    startDate: new Date('2024-12-01'),
  },
  {
    code: 'CASE016',
    notes: 'Giải quyết tranh chấp hợp đồng thương mại và đàm phán thương lượng',
    status: CASE_SERVICE.STATUS.OPEN,
    startDate: new Date('2024-12-20'),
  },
  {
    code: 'CASE017',
    notes: 'Tư vấn bảo hiểm xã hội và chế độ đãi ngộ nhân viên theo luật mới',
    status: CASE_SERVICE.STATUS.COMPLETED,
    startDate: new Date('2024-10-10'),
    endDate: new Date('2024-12-15'),
  },
  {
    code: 'CASE018',
    notes: 'Hỗ trợ pháp lý cho hoạt động xuất khẩu và compliance quốc tế',
    status: CASE_SERVICE.STATUS.IN_PROGRESS,
    startDate: new Date('2024-11-15'),
  },
  {
    code: 'CASE019',
    notes:
      'Tư vấn luật môi trường và xử lý chất thải cho doanh nghiệp sản xuất',
    status: CASE_SERVICE.STATUS.OPEN,
    startDate: new Date('2025-01-08'),
  },
  {
    code: 'CASE020',
    notes: 'Soạn thảo hợp đồng hợp tác kinh doanh và liên doanh chiến lược',
    status: CASE_SERVICE.STATUS.IN_PROGRESS,
    startDate: new Date('2024-12-12'),
  },
];

main().catch((error) => {
  console.error('Script execution failed:', error);
  process.exit(1);
});
