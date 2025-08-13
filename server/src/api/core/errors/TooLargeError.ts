import { ErrorBase } from './error.abstract';
import { statusCodes, reasonPhrases } from '../httpStatusCode';

export class EntityTooLargeError extends ErrorBase {
  status = statusCodes.REQUEST_TOO_LONG;
  isOperation = false;

  constructor(public message = reasonPhrases.REQUEST_TOO_LONG) {
    super(message);

    Object.setPrototypeOf(this, EntityTooLargeError.prototype);
  }
}
