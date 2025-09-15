export interface JwtPayload {
  sub: string;
  email: string;
  role: 'customer' | 'admin';
  iat?: number;
  exp?: number;
}
