require('dotenv').config();
import { mongodbInstance } from '../db/init.mongodb';
import { CUSTOMER } from '@constants/customer.constant';
import { createCustomer } from '@services/customer.service';

async function main() {
  await mongodbInstance.connect();

  console.log('Starting customer generation...');

  for (const customer of CUSTOMERS) {
    try {
      await createCustomer(customer);
      console.log(
        `✓ Created customer: ${customer.firstName} ${customer.lastName} (${customer.code})`
      );
    } catch (error: any) {
      if (error.code === 11000) {
        console.log(`⚠ Customer already exists: ${customer.code}`);
      } else {
        console.error(
          `✗ Error creating customer ${customer.code}:`,
          error.message
        );
      }
    }
  }

  console.log('Customers generated successfully!');

  await mongodbInstance.disconnect();
}

const CUSTOMERS = [
  {
    code: 'CUS001',
    firstName: 'Nguyễn Văn',
    lastName: 'An',
    email: 'nguyen.van.an@email.com',
    msisdn: '0901234567',
    address: {
      province: 'TP.HCM',
      district: 'Quận 1',
      street: '123 Lê Lợi',
    },
    sex: CUSTOMER.SEX.MALE,
    birthDate: '1985-05-15',
    contactChannel: 'Facebook',
    source: 'Facebook',
    notes: 'Khách hàng tiềm năng, quan tâm dịch vụ luật doanh nghiệp',
  },
  {
    code: 'CUS002',
    firstName: 'Trần Thị',
    lastName: 'Bình',
    email: 'tran.thi.binh@email.com',
    msisdn: '0912345678',
    address: {
      province: 'TP.HCM',
      district: 'Quận 1',
      street: '456 Nguyễn Huệ',
    },
    sex: CUSTOMER.SEX.FEMALE,
    birthDate: '1990-08-22',
    contactChannel: 'Zalo',
    source: 'Website',
    notes: 'Cần tư vấn về luật lao động',
  },
  {
    code: 'CUS003',
    firstName: 'Lê Minh',
    lastName: 'Cường',
    email: 'le.minh.cuong@email.com',
    msisdn: '0923456789',
    address: {
      province: 'TP.HCM',
      district: 'Quận 5',
      street: '789 Trần Hưng Đạo',
    },
    sex: CUSTOMER.SEX.MALE,
    birthDate: '1988-12-10',
    contactChannel: 'Phone',
    source: 'Referral',
    notes: 'Giới thiệu từ khách hàng cũ, quan tâm dịch vụ tư vấn thuế',
  },
  {
    code: 'CUS004',
    firstName: 'Phạm Thị',
    lastName: 'Dung',
    email: 'pham.thi.dung@email.com',
    msisdn: '0934567890',
    address: {
      province: 'TP.HCM',
      district: 'Quận 3',
      street: '321 Võ Văn Tần',
    },
    sex: CUSTOMER.SEX.FEMALE,
    birthDate: '1992-03-18',
    contactChannel: 'Email',
    source: 'Google Ads',
    notes: 'Startup mới thành lập, cần tư vấn pháp lý toàn diện',
  },
  {
    code: 'CUS005',
    firstName: 'Hoàng Văn',
    lastName: 'Em',
    email: 'hoang.van.em@email.com',
    msisdn: '0945678901',
    address: {
      province: 'TP.HCM',
      district: 'Quận 1',
      street: '654 Lý Tự Trọng',
    },
    sex: CUSTOMER.SEX.MALE,
    birthDate: '1987-07-25',
    contactChannel: 'Facebook',
    source: 'Facebook',
    notes: 'Doanh nghiệp gia đình, cần hỗ trợ về hợp đồng lao động',
  },
  {
    code: 'CUS006',
    firstName: 'Võ Thị',
    lastName: 'Giang',
    email: 'vo.thi.giang@email.com',
    msisdn: '0956789012',
    address: {
      province: 'TP.HCM',
      district: 'Quận 1',
      street: '987 Hai Bà Trưng',
    },
    sex: CUSTOMER.SEX.FEMALE,
    birthDate: '1991-11-30',
    contactChannel: 'Zalo',
    source: 'LinkedIn',
    notes: 'Luật sư trẻ, tìm hiểu về dịch vụ hỗ trợ pháp lý',
  },
  {
    code: 'CUS007',
    firstName: 'Đặng Minh',
    lastName: 'Hải',
    email: 'dang.minh.hai@email.com',
    msisdn: '0967890123',
    address: {
      province: 'TP.HCM',
      district: 'Quận 1',
      street: '147 Pasteur',
    },
    sex: CUSTOMER.SEX.MALE,
    birthDate: '1989-04-12',
    contactChannel: 'Phone',
    source: 'Website',
    notes: 'Công ty công nghệ, quan tâm đến bảo vệ sở hữu trí tuệ',
  },
  {
    code: 'CUS008',
    firstName: 'Bùi Thị',
    lastName: 'Inh',
    email: 'bui.thi.inh@email.com',
    msisdn: '0978901234',
    address: {
      province: 'TP.HCM',
      district: 'Quận 10',
      street: '258 Cách Mạng Tháng 8',
    },
    sex: CUSTOMER.SEX.FEMALE,
    birthDate: '1993-09-08',
    contactChannel: 'Email',
    source: 'Referral',
    notes: 'Nhà đầu tư bất động sản, cần tư vấn về luật đất đai',
  },
  {
    code: 'CUS009',
    firstName: 'Lý Văn',
    lastName: 'Khánh',
    email: 'ly.van.khanh@email.com',
    msisdn: '0989012345',
    address: {
      province: 'TP.HCM',
      district: 'Quận Bình Thạnh',
      street: '369 Điện Biên Phủ',
    },
    sex: CUSTOMER.SEX.MALE,
    birthDate: '1986-01-20',
    contactChannel: 'Facebook',
    source: 'Facebook',
    notes: 'Chủ chuỗi nhà hàng, cần tư vấn về franchising',
  },
  {
    code: 'CUS010',
    firstName: 'Đỗ Thị',
    lastName: 'Lan',
    email: 'do.thi.lan@email.com',
    msisdn: '0990123456',
    address: {
      province: 'TP.HCM',
      district: 'Quận 3',
      street: '741 Nguyễn Thị Minh Khai',
    },
    sex: CUSTOMER.SEX.FEMALE,
    birthDate: '1994-06-14',
    contactChannel: 'Zalo',
    source: 'Google Ads',
    notes: 'E-commerce startup, quan tâm đến luật thương mại điện tử',
  },
  {
    code: 'CUS011',
    firstName: 'Vũ Minh',
    lastName: 'Nam',
    email: 'vu.minh.nam@email.com',
    msisdn: '0901234560',
    address: {
      province: 'TP.HCM',
      district: 'Quận Tân Bình',
      street: '852 Cộng Hòa',
    },
    sex: CUSTOMER.SEX.MALE,
    birthDate: '1990-10-05',
    contactChannel: 'Phone',
    source: 'LinkedIn',
    notes: 'Giám đốc HR, cần tư vấn về chính sách lao động mới',
  },
  {
    code: 'CUS012',
    firstName: 'Mai Thị',
    lastName: 'Oanh',
    email: 'mai.thi.oanh@email.com',
    msisdn: '0912345670',
    address: {
      province: 'TP.HCM',
      district: 'Quận 11',
      street: '963 Lạc Long Quân',
    },
    sex: CUSTOMER.SEX.FEMALE,
    birthDate: '1988-02-28',
    contactChannel: 'Email',
    source: 'Website',
    notes: 'Chủ spa và thẩm mỹ viện, cần tư vấn về giấy phép kinh doanh',
  },
  {
    code: 'CUS013',
    firstName: 'Ngô Văn',
    lastName: 'Phúc',
    email: 'ngo.van.phuc@email.com',
    msisdn: '0923456780',
    address: {
      province: 'TP.HCM',
      district: 'Quận Phú Nhuận',
      street: '174 Hoàng Văn Thụ',
    },
    sex: CUSTOMER.SEX.MALE,
    birthDate: '1991-12-03',
    contactChannel: 'Facebook',
    source: 'Referral',
    notes: 'Freelancer IT, quan tâm đến hợp đồng dịch vụ',
  },
  {
    code: 'CUS014',
    firstName: 'Hồ Thị',
    lastName: 'Quỳnh',
    email: 'ho.thi.quynh@email.com',
    msisdn: '0934567801',
    address: {
      province: 'TP.HCM',
      district: 'Quận Bình Thạnh',
      street: '285 Xô Viết Nghệ Tĩnh',
    },
    sex: CUSTOMER.SEX.FEMALE,
    birthDate: '1987-08-16',
    contactChannel: 'Zalo',
    source: 'Google Ads',
    notes: 'Chủ trung tâm giáo dục, cần tư vấn về luật giáo dục',
  },
  {
    code: 'CUS015',
    firstName: 'Chu Minh',
    lastName: 'Rồng',
    email: 'chu.minh.rong@email.com',
    msisdn: '0945678912',
    address: {
      province: 'TP.HCM',
      district: 'Quận Gò Vấp',
      street: '396 Nguyễn Kiệm',
    },
    sex: CUSTOMER.SEX.MALE,
    birthDate: '1989-05-09',
    contactChannel: 'Phone',
    source: 'LinkedIn',
    notes: 'Xuất nhập khẩu, cần tư vấn về luật hải quan và thương mại',
  },
];

main().catch((error) => {
  console.error('Script execution failed:', error);
  process.exit(1);
});
