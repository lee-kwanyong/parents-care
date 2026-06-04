declare module 'solapi' {
  export class SolapiMessageService {
    constructor(apiKey: string, apiSecret: string)
    send(message: Record<string, unknown>): Promise<unknown>
    sendMany?(messages: Array<Record<string, unknown>>): Promise<unknown>
  }
}
