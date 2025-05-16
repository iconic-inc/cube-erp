interface IDiscordConfig {
  token: string;
  channelId: string;
}

const discordConfigEnv: Record<string, IDiscordConfig> = {
  development: {
    token: process.env.DEV_DISCORD_TOKEN as string,
    channelId: process.env.DEV_DISCORD_CHANNEL_ID as string,
  },
  production: {
    token: process.env.PRO_DISCORD_TOKEN as string,
    channelId: process.env.PRO_DISCORD_CHANNEL_ID as string,
  },
};

export const discordConfig: IDiscordConfig =
  discordConfigEnv[process.env.NODE_ENV || 'development'] ||
  discordConfigEnv.development;
