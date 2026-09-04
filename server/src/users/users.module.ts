import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Assignment,
  AssignmentSchema,
} from '../assignments/schemas/assignment.schema';
import { Question, QuestionSchema } from '../questions/schemas/question.schema';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
