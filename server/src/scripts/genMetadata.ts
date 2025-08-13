require('dotenv').config();
import { mongodbInstance } from '../db/init.mongodb';
import { TEMPLATE } from 'src/api/constants';
import { TemplateModel } from '@models/template.model';
import { emailVerificationEmailTemplate } from '@utils/email.template';
import { passwordEmailTemplate } from '@utils/password.template';
import { newTaskTemplate } from '@utils/new-task.template';

const htmlTemplate = {
  [TEMPLATE.NAME.PASSWORD]: passwordEmailTemplate,
  [TEMPLATE.NAME.VERIFY_EMAIL]: emailVerificationEmailTemplate,
  [TEMPLATE.NAME.NEW_TASK]: newTaskTemplate,
  [TEMPLATE.NAME.TASK_REMINDER]: newTaskTemplate,
};

async function main() {
  await mongodbInstance.connect();

  for (const name of Object.keys(htmlTemplate)) {
    await TemplateModel.build({
      name,
      html: htmlTemplate[name as keyof typeof htmlTemplate](),
      status: 'active',
    });
  }

  console.log('Metadata generated successfully!');

  await mongodbInstance.disconnect();
}

main();
