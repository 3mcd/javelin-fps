export type AppConfig = {
  API_HOST: string
  INPUT_SEND_RATE: string
}

const config: AppConfig = (window as any).APP_CONFIG

// export const API_HOST = config.API_HOST
export const API_HOST = "68.183.59.27:3000"
export const INPUT_SEND_RATE = Number(config.INPUT_SEND_RATE)
