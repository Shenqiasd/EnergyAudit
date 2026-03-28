/**
 * Injection token for the Drizzle ORM database instance.
 * Extracted to its own file to avoid circular dependency between
 * database.module.ts and drizzle.provider.ts under CommonJS compilation.
 */
export const DRIZZLE = Symbol('DRIZZLE');
