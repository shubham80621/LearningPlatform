import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Assignment,
  AssignmentSchema,
} from '../assignments/schemas/assignment.schema';
import { UploadsModule } from '../uploads/uploads.module';
import { Video, VideoSchema } from './schemas/video.schema';
import { Question, QuestionSchema } from '../questions/schemas/question.schema';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Video.name, schema: VideoSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Assignment.name, schema: AssignmentSchema },
    ]),
    UploadsModule,
  ],
  controllers: [VideosController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}
