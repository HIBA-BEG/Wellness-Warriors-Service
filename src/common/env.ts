import { ConfigService } from '@nestjs/config';

export function readConfig(
  config: ConfigService,
  ...names: string[]
): string | undefined {
  for (const name of names) {
    const value = config.get<string>(name);
    if (value) {
      return value;
    }
  }
  return undefined;
}
