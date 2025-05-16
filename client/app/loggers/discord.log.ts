import { discordConfig } from '@configs/discord.config';
import { Client, Colors, GatewayIntentBits, TextChannel } from 'discord.js';

class LoggerService {
  private client: Client;
  private channelId: string;

  constructor() {
    this.channelId = discordConfig.channelId || '';
    this.client = new Client({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.client.login(discordConfig.token);

    this.client.on('ready', () => {
      if (!this.client.user) return;

      console.log(`Logged in as ${this.client.user.tag}`);
    });

    this.client.on('error', (error) => {
      console.log('discord error');
      console.error(error);
    });
  }

  async sendFormatLog({
    host,
    title,
    code,
  }: {
    host: string;
    title: string;
    code: any;
  }) {
    const formattedLog = {
      content: host,
      embeds: [
        {
          color: Colors.Red,
          title,
          description:
            '```json\n' +
            JSON.stringify(code, null, 2) +
            '\n```'.substring(0, 4000),
        },
      ],
    };

    await this.sendLog(formattedLog);
  }

  async sendLog(log: any) {
    if (!this.client.user) return;
    const channel = this.client.channels.cache.get(this.channelId);
    if (!channel) {
      console.log('Channel not found');
      return;
    }

    await (channel as TextChannel).send(log).catch(console.error);
  }
}

const logger = new LoggerService();

function pushLog2Discord(req: {
  method: string;
  host: string;
  path: string;
  body: any;
  response: {
    metadata?: any;
    errors?: {
      status?: number;
      message?: string;
    };
  };
}) {
  logger
    .sendFormatLog({
      host: req.host,
      title: req.method.toUpperCase() + ' ' + req.path,
      code: { body: req.body, response: req.response },
    })
    .then(() => {
      console.log('Log sent to Discord');
    })
    .catch((err) => {
      console.error('Error sending log to Discord:', err);
    });
}

export { pushLog2Discord };
