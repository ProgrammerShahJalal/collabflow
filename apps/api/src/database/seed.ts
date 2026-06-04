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

  const password = process.env.DEMO_ADMIN_PASSWORD ?? 'Demo@1234';
  const passwordHash = await bcrypt.hash(password, 12);

  const demoUsers = [
    {
      name: 'Demo Admin',
      email: (process.env.DEMO_ADMIN_EMAIL ?? 'admin@collabflow.dev').toLowerCase(),
      role: UserRole.ADMIN,
    },
    {
      name: 'Demo Project Manager',
      email: (process.env.DEMO_MANAGER_EMAIL ?? 'manager@collabflow.dev').toLowerCase(),
      role: UserRole.PROJECT_MANAGER,
    },
    {
      name: 'Demo Team Member',
      email: (process.env.DEMO_MEMBER_EMAIL ?? 'member@collabflow.dev').toLowerCase(),
      role: UserRole.TEAM_MEMBER,
    },
  ];

  for (const demo of demoUsers) {
    const existing = await em.findOne(User, { email: demo.email });
    if (existing) {
      console.log(`ℹ️  ${demo.name} already exists, skipping.`);
      continue;
    }
    em.create(User, {
      name: demo.name,
      email: demo.email,
      passwordHash,
      role: demo.role,
      isActive: true,
    });
    console.log('✅ Demo user seeded:', demo.email);
  }
  await em.flush();

  await orm.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
