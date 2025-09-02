declare namespace Express {
  interface Request {
    cookies: {
      [key: string]: string;
    };
    user?: {
      sub: string;
      email: string;
    };
  }
}
