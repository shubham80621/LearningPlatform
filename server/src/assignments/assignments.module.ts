import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from '../questions/schemas/question.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Video, VideoSchema } from '../videos/schemas/video.schema';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { Assignment, AssignmentSchema } from './schemas/assignment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assignment.name, schema: AssignmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Video.name, schema: VideoSchema },
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
