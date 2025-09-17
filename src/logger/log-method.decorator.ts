import { SetMetadata } from '@nestjs/common';

export const LOG_METHOD_KEY = 'logMethod';
export const LogMethod = (enabled: boolean = true) =>
  SetMetadata(LOG_METHOD_KEY, enabled);
