export enum TokenType {
  ACCESS = 'access',
  RESET = 'reset',
}

export function accessTokenExpires(): string {
  return process.env.JWT_ACCESS_EXPIRES || '1h';
}

export function resetTokenExpires(): string {
  return process.env.JWT_RESET_EXPIRES || '1h';
}
