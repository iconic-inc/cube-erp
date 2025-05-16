import { Model, HydratedDocument, ObjectId } from 'mongoose';

interface IRawKeyToken {
  _id: string | ObjectId;
  user: string | ObjectId;
  browserId: string;
  publicKey: string;
  privateKey: string;
  refreshTokensUsed: string[];
  refreshToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IKeyToken = HydratedDocument<IRawKeyToken>;

export interface IKeyTokenAttrs {
  user: string;
  browserId: string;
  publicKey: string;
  privateKey: string;
  refreshTokensUsed?: string[];
  refreshToken: string;
}

export interface IKeyTokenModel extends Model<IKeyToken> {
  build(attrs: IKeyTokenAttrs): Promise<IKeyToken>;
}
