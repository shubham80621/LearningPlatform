import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserSchema, UserRole } from './users/schemas/user.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-platform',
    ),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
})
class SeedModule {}

async function seed() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  const users = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: UserRole.ADMIN,
    },
    {
      name: 'Learner One',
      email: 'learner@example.com',
      password: 'learner123',
      role: UserRole.LEARNER,
    },
  ];

  for (const item of users) {
    const passwordHash = await bcrypt.hash(item.password, 10);
    await userModel.findOneAndUpdate(
      { email: item.email },
      {
        name: item.name,
        email: item.email,
        passwordHash,
        role: item.role,
      },
      { upsert: true, new: true },
    );
    console.log(`Seeded ${item.role}: ${item.email} / ${item.password}`);
  }

  await app.close();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
