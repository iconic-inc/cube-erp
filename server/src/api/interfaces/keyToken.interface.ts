import { Model, HydratedDocument, ObjectId } from 'mongoose';

export interface IKeyToken {
  id: string | ObjectId;
  user: string | ObjectId;
  browserId: string;
  publicKey: string;
  privateKey: string;
  refreshTokensUsed: string[];
  refreshToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IKeyTokenDocument = HydratedDocument<IKeyToken>;

export interface IKeyTokenCreate {
  user: string;
  browserId: string;
  publicKey: string;
  privateKey: string;
  refreshTokensUsed?: string[];
  refreshToken: string;
}

export interface IKeyTokenModel extends Model<IKeyTokenDocument> {
  build(attrs: IKeyTokenCreate): Promise<IKeyTokenDocument>;
}
