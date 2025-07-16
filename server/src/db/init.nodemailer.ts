import { serverConfig } from '@configs/config.server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: serverConfig.SMTPUser,
    pass: serverConfig.SMTPPassword,
  },
});

export { transporter };
