import { ZodObject } from 'zod';
import { BadRequestError } from '../core/errors';
import { isValidObjectId } from 'mongoose';
import { removeNestedNullish } from '@utils/index';

export const validateSchema = (schema: ZodObject<any>) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.safeParse(removeNestedNullish(req.body));
    if (error) {
      console.log(error.flatten());
      throw new BadRequestError(error.issues[0].message);
    }
    next();
  };
};

export const validateObjectId =
  (fieldName: string) => (req: any, res: any, next: any) => {
    const id = req.params[fieldName];
    if (!isValidObjectId(id)) {
      throw new BadRequestError('Invalid request!');
    }
    next();
  };
