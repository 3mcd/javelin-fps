export type AppConfig = {
  API_HOST: string
  INPUT_SEND_RATE: string
}

const config: AppConfig = (window as any).APP_CONFIG

export const API_HOST = config.API_HOST
export const INPUT_SEND_RATE = Number(config.INPUT_SEND_RATE)
