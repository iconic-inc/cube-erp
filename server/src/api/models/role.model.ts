import { Schema, model, Types, Model, models } from 'mongoose';
import { ROLE } from '../constants';
import {
  IRoleCreate,
  IRoleDocument,
  IRoleModel,
} from '../interfaces/role.interface';

// Định nghĩa các action types được phép
const VALID_ACTIONS = [
  'create:any',
  'read:any',
  'update:any',
  'delete:any',
  'create:own',
  'read:own',
  'update:own',
  'delete:own',
];

const roleSchema = new Schema<IRoleDocument, IRoleModel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    description: {
      type: String,
      required: true,
    },
    grants: {
      type: [
        {
          resourceId: {
            type: Schema.Types.ObjectId,
            ref: 'Resource',
            required: true,
          },
          actions: [
            {
              type: String,
              enum: VALID_ACTIONS,
              required: true,
            },
          ],
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: ROLE.COLLECTION_NAME,
  }
);

roleSchema.statics.build = (attrs: IRoleCreate) => {
  return RoleModel.create(attrs);
};

export const RoleModel =
  (models[ROLE.DOCUMENT_NAME] as IRoleModel) ||
  model<IRoleDocument, IRoleModel>(ROLE.DOCUMENT_NAME, roleSchema);
