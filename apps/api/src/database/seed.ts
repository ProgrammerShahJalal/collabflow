import 'dotenv/config';
import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/mongodb';
import * as bcrypt from 'bcryptjs';
import config from '../mikro-orm.config';
import { User, UserRole } from '../users/user.entity';

async function seed() {
  const orm = await MikroORM.init(config);
  await orm.getSchemaGenerator().ensureIndexes();
  const em = orm.em.fork();

  const email = process.env.DEMO_ADMIN_EMAIL ?? 'admin@collabflow.dev';
  const password = process.env.DEMO_ADMIN_PASSWORD ?? 'Demo@1234';

  const existing = await em.findOne(User, { email });
  if (existing) {
    console.log('ℹ️  Demo admin already exists, skipping.');
  } else {
    const admin = em.create(User, {
      name: 'Demo Admin',
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      role: UserRole.ADMIN,
      isActive: true,
    });
    await em.persistAndFlush(admin);
    console.log('✅ Demo admin seeded:', email);
  }

  await orm.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
