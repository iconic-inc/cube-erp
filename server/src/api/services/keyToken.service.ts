import mongoose from 'mongoose';
import {
  IKeyToken,
  IKeyTokenCreate,
  IKeyTokenDocument,
  IKeyTokenModel,
} from '../interfaces/keyToken.interface';
import { KeyTokenModel } from '../models/keyToken.model';

async function createKeyToken({
  user,
  browserId,
  privateKey,
  publicKey,
  refreshToken,
  refreshTokensUsed = [],
}: IKeyTokenCreate) {
  // const keyToken = await KeyTokenModel.build({
  //   user: userId,
  //   privateKey: privateKey.toString(),
  //   publicKey: publicKey.toString(),
  //   refreshToken: 'hello',
  // });

  const filter = { user, browserId };
  const update = {
    privateKey: privateKey.toString(),
    publicKey: publicKey.toString(),
    refreshToken,
    $push: { refreshTokensUsed: { $each: refreshTokensUsed } },
  };
  const options = { upsert: true, new: true };

  const keyToken = await KeyTokenModel.findOneAndUpdate<IKeyToken>(
    filter,
    update,
    options
  );

  return { publicKey: keyToken?.publicKey, privateKey: keyToken?.privateKey };
}

const findByUserId = async (userId: string, browserId: string) => {
  return KeyTokenModel.findOne<IKeyTokenDocument>({
    user: new mongoose.Types.ObjectId(userId),
    browserId,
  });
};

const removeKeyById = async (id: string) => {
  return KeyTokenModel.deleteOne({ _id: id }).lean();
};

const findUsedRefreshToken = async (refreshToken: string) => {
  return KeyTokenModel.findOne({ refreshTokensUsed: refreshToken }).lean();
};

const findByRefreshToken = async (refreshToken: string) => {
  return KeyTokenModel.findOne({ refreshToken }).lean();
};

const updateRefreshToken = async (
  foundToken: IKeyTokenDocument,
  refreshToken: string,
  newRefreshToken: string
) => {
  return foundToken.updateOne({
    refreshToken: newRefreshToken,
    $push: { refreshTokensUsed: refreshToken },
  });
};

export {
  createKeyToken,
  findByUserId,
  removeKeyById,
  findUsedRefreshToken,
  findByRefreshToken,
  updateRefreshToken,
};
