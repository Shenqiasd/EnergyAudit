// This file is kept for backward compatibility.
// The actual JWT-based auth guard is in modules/auth/auth.guard.ts
// and is registered globally via APP_GUARD in AuthModule.
export { JwtAuthGuard as AuthGuard } from '../../modules/auth/auth.guard';
