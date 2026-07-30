export interface JwtPayload {
  /** ID do usuário (subject do token). */
  sub: string;
  email: string;
}
