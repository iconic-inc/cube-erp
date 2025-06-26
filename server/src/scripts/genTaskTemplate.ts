require('dotenv').config();
import { ITaskTemplateCreate } from '@/api/interfaces/taskTemplate.interface';
import { mongodbInstance } from '@/db/init.mongodb';
import { TASK } from '@constants/task.constant';
import { TaskTemplateModel } from '@models/taskTemplate.model';

async function main() {
  const defaultTaskTemplate: Array<ITaskTemplateCreate> = [
    {
      name: 'Quy trình mặc định',
      key: 'default',
      steps: [
        {
          name: 'Tiếp nhận thông tin',
          description:
            'Tiếp nhận yêu cầu từ khách hàng, ghi nhận các thông tin ban đầu liên quan đến vụ việc để phục vụ quá trình xử lý tiếp theo.',
          caseOrder: 1,
          priority: TASK.PRIORITY.MEDIUM,
        },
        {
          name: 'Rà soát hồ sơ',
          description:
            'Thu thập và kiểm tra tính hợp lệ, đầy đủ của hồ sơ pháp lý do khách hàng cung cấp; yêu cầu bổ sung nếu thiếu hoặc chưa chính xác.',
          caseOrder: 2,
          priority: TASK.PRIORITY.MEDIUM,
        },
        {
          name: 'Nghiên cứu pháp lý',
          description:
            'Nghiên cứu các quy định pháp luật có liên quan và đánh giá tình huống vụ việc để xác định hướng xử lý phù hợp.',
          caseOrder: 3,
          priority: TASK.PRIORITY.MEDIUM,
        },
        {
          name: 'Soạn thảo văn bản',
          description:
            'Soạn thảo các văn bản pháp lý cần thiết như thư tư vấn, công văn, đơn từ hoặc hồ sơ pháp lý khác theo hướng xử lý đã thống nhất.',
          caseOrder: 4,
          priority: TASK.PRIORITY.MEDIUM,
        },
        {
          name: 'Làm việc với các bên',
          description:
            'Đại diện khách hàng hoặc phối hợp với các bên liên quan như cơ quan nhà nước, đối tác, bên tranh chấp để giải quyết vụ việc.',
          caseOrder: 5,
          priority: TASK.PRIORITY.MEDIUM,
        },
        {
          name: 'Theo dõi & cập nhật',
          description:
            'Theo dõi tiến độ xử lý vụ việc, cập nhật thông tin định kỳ hoặc đột xuất cho khách hàng nhằm đảm bảo minh bạch và phối hợp hiệu quả.',
          caseOrder: 6,
          priority: TASK.PRIORITY.MEDIUM,
        },
        {
          name: 'Kết thúc & lưu trữ',
          description:
            'Tổng kết quá trình xử lý, bàn giao kết quả, lưu trữ hồ sơ và các tài liệu liên quan để phục vụ tra cứu hoặc hậu kiểm sau này.',
          caseOrder: 7,
          priority: TASK.PRIORITY.MEDIUM,
        },
      ],
    },
  ];

  await mongodbInstance.connect();

  for (const template of defaultTaskTemplate) {
    const taskTemplate = await TaskTemplateModel.build(template);
    console.log(`Created task template: ${taskTemplate.tpl_name}`);
  }
  console.log('Task templates generated successfully!');
}

main()
  .then(() => {
    console.log('Script completed successfully.');
  })
  .catch((error) => {
    console.error('Error occurred:', error);
  })
  .finally(() => {
    // Ensure to disconnect from the database if needed
    mongodbInstance
      .disconnect()
      .then(() => console.log('Disconnected from database.'))
      .catch((err) => console.error('Error disconnecting from database:', err));
  });
