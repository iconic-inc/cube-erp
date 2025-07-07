import { Schema, model } from 'mongoose';
import { REWARD, USER } from '../constants';
import {
  IRewardCreate,
  IRewardDocument,
  IRewardModel,
} from '../interfaces/reward.interface';
import { formatAttributeName } from '@utils/index';

const rewardSchema = new Schema<IRewardDocument, IRewardModel>(
  {
    rw_name: {
      type: String,
      required: true,
      trim: true,
    },
    rw_description: {
      type: String,
      trim: true,
    },
    rw_currentAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    rw_status: {
      type: String,
      enum: Object.values(REWARD.STATUS),
      default: REWARD.STATUS.ACTIVE,
    },
    rw_startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    rw_endDate: {
      type: Date,
    },
    rw_eventType: {
      type: String,
      enum: Object.values(REWARD.EVENT_TYPE),
      required: true,
    },
    rw_cashedOutAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: REWARD.COLLECTION_NAME,
  }
);

// Index for better query performance
rewardSchema.index({ rw_status: 1, rw_eventType: 1 });
rewardSchema.index({ rw_startDate: 1, rw_endDate: 1 });

rewardSchema.statics.build = (attrs: IRewardCreate) => {
  return RewardModel.create(formatAttributeName(attrs, REWARD.PREFIX));
};

export const RewardModel = model<IRewardDocument, IRewardModel>(
  REWARD.DOCUMENT_NAME,
  rewardSchema
);
