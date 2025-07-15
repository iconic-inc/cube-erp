import { transporter } from '../../db/init.nodemailer';
import { getTemplate } from './template.service';
import { TEMPLATE } from '../constants';
import { replaceTemplatePlaceholders } from '@utils/index';
import { newOTP } from './otp.service';
import { serverConfig } from '@configs/config.server';
import { newTaskTemplate } from '@utils/new-task.template';

const sendMail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    return await transporter.sendMail({
      from: serverConfig.SMTPUser,
      to,
      subject,
      html,
    });
  } catch (error) {
    throw new Error(`Error sending email: ${error}`);
  }
};

const sendVerificationEmail = async (toEmail: string) => {
  const otp = await newOTP(toEmail);

  const template = await getTemplate(TEMPLATE.NAME.VERIFY_EMAIL);
  if (!template) {
    throw new Error('Email verification template not found');
  }

  const html = replaceTemplatePlaceholders(template.tem_html!, {
    verifyUrl: `${serverConfig.serverUrl}/api/v1/auth/verify-email?token=${otp.otp_token}`,
  });

  return await sendMail({
    to: toEmail,
    subject: 'Xác nhận địa chỉ email',
    html,
  });
};

const sendTempPassEmail = async (
  toEmail: string,
  { password, username }: { password: string; username: string }
) => {
  const template = await getTemplate(TEMPLATE.NAME.PASSWORD);
  if (!template) {
    throw new Error('Email verification template not found');
  }

  const html = replaceTemplatePlaceholders(template.tem_html!, {
    clientUrl: serverConfig.clientUrl,
    password,
    username,
  });

  return await sendMail({
    to: toEmail,
    subject: 'Mật khẩu tạm thời',
    html,
  });
};

const sendTaskNotificationEmail = async (
  toEmail: string,
  taskData: {
    taskId: string;
    taskName: string;
    taskDescription: string;
    priority: string;
    startDate: string;
    endDate: string;
    employeeName: string;
  }
) => {
  try {
    const template = newTaskTemplate();

    // Format priority in Vietnamese
    const priorityVietnamese =
      {
        low: 'Thấp',
        medium: 'Trung bình',
        high: 'Cao',
        urgent: 'Khẩn cấp',
      }[taskData.priority] || taskData.priority;
    const priorityClass =
      {
        low: 'bg-green-500 text-white px-3 py-1 rounded-full',
        medium: 'bg-yellow-500 text-white px-3 py-1 rounded-full',
        high: 'bg-orange-500 text-white px-3 py-1 rounded-full',
        urgent: 'bg-red-500 text-white px-3 py-1 rounded-full',
      }[taskData.priority] || 'bg-gray-500 text-white px-3 py-1 rounded-full';

    const html = replaceTemplatePlaceholders(template, {
      taskName: taskData.taskName,
      employeeName: taskData.employeeName,
      taskDescription: taskData.taskDescription,
      priority: priorityVietnamese,
      priorityClass,
      startDate: taskData.startDate,
      endDate: taskData.endDate,
      clientUrl: serverConfig.clientUrl,
      taskUrl: `${serverConfig.clientUrl}/erp/tasks/${taskData.taskId}`,
    });

    return await sendMail({
      to: toEmail,
      subject: `Task mới: ${taskData.taskName}`,
      html,
    });
  } catch (error) {
    console.error('Error sending task notification email:', error);
    throw new Error(`Error sending task notification email: ${error}`);
  }
};

export {
  sendMail,
  sendVerificationEmail,
  sendTempPassEmail,
  sendTaskNotificationEmail,
};
