import 'dotenv/config';
import { defineConfig } from '@mikro-orm/mongodb';

export default defineConfig({
  clientUrl: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/collabflow',
  dbName: 'collabflow',
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  // Default ReflectMetadataProvider — works with emitDecoratorMetadata.
  // All non-trivial fields (enums, arrays, nullables) carry explicit type hints.
  ensureIndexes: true,
  debug: process.env.NODE_ENV === 'development',
});
