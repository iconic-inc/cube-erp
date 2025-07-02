require('dotenv').config();
import { mongodbInstance } from '../db/init.mongodb';
import { RewardModel } from '@models/reward.model';
import { REWARD } from '../api/constants';
import { removeNestedNullish } from '@utils/index';
import { IRewardCreate } from '../api/interfaces/reward.interface';

async function main() {
  await mongodbInstance.connect();

  // Clear existing rewards (optional - uncomment if needed)
  // await RewardModel.deleteMany({});

  // Create sample rewards
  for (const reward of SAMPLE_REWARDS) {
    try {
      const rewardData = { ...reward };

      // Format data for RewardModel.build
      if (reward.status) {
        rewardData.status = reward.status;
        delete rewardData.cashedOutAt; // Handle separately
      }

      const createdReward = await RewardModel.build(
        removeNestedNullish(rewardData)
      );

      // Set cashedOutAt for closed rewards
      if (reward.cashedOutAt) {
        await RewardModel.findByIdAndUpdate(createdReward.id, {
          rw_cashedOutAt: reward.cashedOutAt,
        });
      }

      console.log(`Created reward: ${reward.name}`);
    } catch (error) {
      console.error(`Error creating reward ${reward.name}:`, error);
    }
  }

  console.log('Reward data generated successfully!');
  await mongodbInstance.disconnect();
}

// Define extended interface for our sample data
interface ISampleReward extends IRewardCreate {
  status?: string;
  cashedOutAt?: Date;
}

// Sample data with different reward types and statuses
const SAMPLE_REWARDS: ISampleReward[] = [
  {
    name: 'Thưởng Tết Nguyên Đán 2025',
    description: 'Quỹ thưởng Tết Nguyên Đán cho nhân viên xuất sắc năm 2025',
    currentAmount: 50000000,
    eventType: REWARD.EVENT_TYPE.NEW_YEAR,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
  },
  {
    name: 'Thưởng Quý 2/2025',
    description: 'Quỹ thưởng thành tích quý 2 năm 2025',
    currentAmount: 30000000,
    eventType: REWARD.EVENT_TYPE.QUARTERLY,
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-06-30'),
  },
  {
    name: 'Thưởng Thành Tích Xuất Sắc 2025',
    description: 'Quỹ thưởng cho nhân viên có thành tích xuất sắc năm 2025',
    currentAmount: 25000000,
    eventType: REWARD.EVENT_TYPE.ACHIEVEMENT,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
  },
  {
    name: 'Thưởng Lễ Quốc Khánh 2025',
    description: 'Quỹ thưởng nhân dịp Lễ Quốc Khánh 2/9/2025',
    currentAmount: 20000000,
    eventType: REWARD.EVENT_TYPE.HOLIDAY,
    startDate: new Date('2025-08-15'),
    endDate: new Date('2025-09-02'),
  },
  {
    name: 'Thưởng Tháng 7/2025',
    description: 'Quỹ thưởng tháng 7 năm 2025',
    currentAmount: 15000000,
    eventType: REWARD.EVENT_TYPE.MONTHLY,
    startDate: new Date('2025-07-01'),
    endDate: new Date('2025-07-31'),
  },
  {
    name: 'Thưởng Dự Án Đặc Biệt 2025',
    description: 'Quỹ thưởng cho team hoàn thành xuất sắc dự án đặc biệt',
    currentAmount: 40000000,
    eventType: REWARD.EVENT_TYPE.SPECIAL,
    startDate: new Date('2025-05-01'),
    endDate: new Date('2025-08-31'),
  },
  {
    name: 'Thưởng Kỷ Niệm Thành Lập Công Ty',
    description: 'Quỹ thưởng nhân dịp kỷ niệm ngày thành lập công ty',
    currentAmount: 35000000,
    eventType: REWARD.EVENT_TYPE.SPECIAL,
    startDate: new Date('2025-10-01'),
    endDate: new Date('2025-10-15'),
  },
  {
    name: 'Thưởng Cuối Năm 2025',
    description: 'Quỹ thưởng tổng kết cuối năm 2025',
    currentAmount: 60000000,
    eventType: REWARD.EVENT_TYPE.SPECIAL,
    startDate: new Date('2025-12-01'),
    endDate: new Date('2025-12-31'),
  },
  // A few rewards with different statuses - these will be set to CLOSED
  {
    name: 'Thưởng Quý 1/2025 (Đã đóng)',
    description: 'Quỹ thưởng thành tích quý 1 năm 2025 (đã phân phối)',
    currentAmount: 0, // All funds used
    eventType: REWARD.EVENT_TYPE.QUARTERLY,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-03-31'),
    status: REWARD.STATUS.CLOSED,
    cashedOutAt: new Date('2025-04-05'),
  },
  {
    name: 'Thưởng Tháng 5/2025 (Đã đóng)',
    description: 'Quỹ thưởng tháng 5 năm 2025 (đã phân phối)',
    currentAmount: 0, // All funds used
    eventType: REWARD.EVENT_TYPE.MONTHLY,
    startDate: new Date('2025-05-01'),
    endDate: new Date('2025-05-31'),
    status: REWARD.STATUS.CLOSED,
    cashedOutAt: new Date('2025-06-03'),
  },
];

// Run the script
main().catch(console.error);
