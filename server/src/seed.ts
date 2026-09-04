import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { existsSync } from 'fs';
import { join } from 'path';
import { Model, Types } from 'mongoose';
import {
  Assignment,
  AssignmentSchema,
  AssignmentStatus,
} from './assignments/schemas/assignment.schema';
import {
  Question,
  QuestionSchema,
  QuestionType,
} from './questions/schemas/question.schema';
import { UPLOAD_ROOT } from './uploads/upload.constants';
import { User, UserRole, UserSchema } from './users/schemas/user.schema';
import { Video, VideoSchema } from './videos/schemas/video.schema';

/**
 * Shared media already in server/uploads/ (one uploaded demo clip).
 * All three seeded videos reuse this file so demos work without extra uploads.
 */
const DEMO_VIDEO_FILE = '3656cac4-34c0-48d5-b2dd-22097dd552fb.mov';
const DEMO_THUMBS = [
  'c5e867d0-dbb8-4ddf-85bd-f4b593081b44.png',
  '698f06ce-c7bb-4c96-8cf4-63ddb1b3d572.png',
  'dd8b9f23-bd73-4114-813e-7fc2bed54996.png',
];
/** Known duration of the demo .mov (seconds). */
const DEMO_DURATION = 31;

type SeedQuestion = {
  timestamp: number;
  type: QuestionType;
  questionText: string;
  options: string[];
  correctOptionIndexes: number[];
  correctAnswer: string;
};

type SeedVideo = {
  title: string;
  description: string;
  thumbnailFile: string;
  questions: SeedQuestion[];
};

const SEED_VIDEOS: SeedVideo[] = [
  {
    title: 'Getting Started with LearnPulse',
    description:
      'A short orientation lesson. Pause when questions appear and answer before continuing.',
    thumbnailFile: DEMO_THUMBS[0],
    questions: [
      {
        timestamp: 5,
        type: QuestionType.SINGLE,
        questionText: 'What is the main goal of this platform?',
        options: [
          'Stream movies',
          'Learn with videos and timestamp quizzes',
          'Edit photos',
          'Host live meetings',
        ],
        correctOptionIndexes: [1],
        correctAnswer: '',
      },
      {
        timestamp: 14,
        type: QuestionType.MULTIPLE,
        questionText: 'Which of these can an admin do? (select all that apply)',
        options: [
          'Upload video lessons',
          'Assign lessons to learners',
          'Delete MongoDB from the browser',
          'Review learner progress',
        ],
        correctOptionIndexes: [0, 1, 3],
        correctAnswer: '',
      },
      {
        timestamp: 24,
        type: QuestionType.SHORT,
        questionText: 'Type the product name shown in the app header (one word).',
        options: [],
        correctOptionIndexes: [],
        correctAnswer: 'LearnPulse',
      },
    ],
  },
  {
    title: 'Watching Lessons Effectively',
    description:
      'Tips for resuming progress and handling interactive questions during playback.',
    thumbnailFile: DEMO_THUMBS[1],
    questions: [
      {
        timestamp: 6,
        type: QuestionType.SINGLE,
        questionText: 'When does a timestamp question usually appear?',
        options: [
          'Only after the video ends',
          'At a specific time during playback',
          'Only on mobile',
          'When the admin emails you',
        ],
        correctOptionIndexes: [1],
        correctAnswer: '',
      },
      {
        timestamp: 16,
        type: QuestionType.SINGLE,
        questionText: 'What happens if you try to seek past an unanswered question?',
        options: [
          'Nothing',
          'The player blocks you and shows the question',
          'The video is deleted',
          'You lose your account',
        ],
        correctOptionIndexes: [1],
        correctAnswer: '',
      },
      {
        timestamp: 25,
        type: QuestionType.SHORT,
        questionText: 'What status means you finished a lesson? (one word)',
        options: [],
        correctOptionIndexes: [],
        correctAnswer: 'completed',
      },
    ],
  },
  {
    title: 'Quiz Tips for Learners',
    description:
      'Practice single-choice, multi-choice, and short answers on one shared demo clip.',
    thumbnailFile: DEMO_THUMBS[2],
    questions: [
      {
        timestamp: 4,
        type: QuestionType.SINGLE,
        questionText: 'How many times can you submit an answer for a question?',
        options: ['Unlimited', 'Once', 'Three times', 'Only after rewatching'],
        correctOptionIndexes: [1],
        correctAnswer: '',
      },
      {
        timestamp: 13,
        type: QuestionType.MULTIPLE,
        questionText: 'Which answer types are supported?',
        options: [
          'Single choice',
          'Multiple choice',
          'Short text',
          'Drawing on canvas',
        ],
        correctOptionIndexes: [0, 1, 2],
        correctAnswer: '',
      },
      {
        timestamp: 22,
        type: QuestionType.SHORT,
        questionText: 'Spell the word for a timed quiz prompt (7 letters).',
        options: [],
        correctOptionIndexes: [],
        correctAnswer: 'question',
      },
    ],
  },
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-platform',
    ),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Video.name, schema: VideoSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Assignment.name, schema: AssignmentSchema },
    ]),
  ],
})
class SeedModule {}

async function seed() {
  const videoPath = join(UPLOAD_ROOT, 'videos', DEMO_VIDEO_FILE);
  if (!existsSync(videoPath)) {
    throw new Error(
      `Demo video missing at uploads/videos/${DEMO_VIDEO_FILE}. Upload one video first, then re-run seed.`,
    );
  }
  for (const thumb of DEMO_THUMBS) {
    const thumbPath = join(UPLOAD_ROOT, 'images', thumb);
    if (!existsSync(thumbPath)) {
      throw new Error(
        `Demo thumbnail missing at uploads/images/${thumb}. Upload a thumbnail first, then re-run seed.`,
      );
    }
  }

  const app = await NestFactory.createApplicationContext(SeedModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const videoModel = app.get<Model<Video>>(getModelToken(Video.name));
  const questionModel = app.get<Model<Question>>(getModelToken(Question.name));
  const assignmentModel = app.get<Model<Assignment>>(
    getModelToken(Assignment.name),
  );

  const users = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: UserRole.ADMIN,
    },
    {
      name: 'Learner One',
      email: 'learner1@example.com',
      password: 'learner123',
      role: UserRole.LEARNER,
    },
    {
      name: 'Learner Two',
      email: 'learner2@example.com',
      password: 'learner123',
      role: UserRole.LEARNER,
    },
    // Kept for older README / habit; same password as learner1.
    {
      name: 'Learner One',
      email: 'learner@example.com',
      password: 'learner123',
      role: UserRole.LEARNER,
    },
  ];

  const userIds: Record<string, Types.ObjectId> = {};

  for (const item of users) {
    const passwordHash = await bcrypt.hash(item.password, 10);
    const user = await userModel.findOneAndUpdate(
      { email: item.email },
      {
        name: item.name,
        email: item.email,
        passwordHash,
        role: item.role,
      },
      { upsert: true, new: true },
    );
    userIds[item.email] = user!._id as Types.ObjectId;
    console.log(`Seeded ${item.role}: ${item.email} / ${item.password}`);
  }

  const adminId = userIds['admin@example.com'];
  const learner1Id = userIds['learner1@example.com'];
  const videoUrl = `/uploads/videos/${DEMO_VIDEO_FILE}`;
  const seededVideoIds: Types.ObjectId[] = [];

  for (const item of SEED_VIDEOS) {
    const thumbnailUrl = `/uploads/images/${item.thumbnailFile}`;
    const video = await videoModel.findOneAndUpdate(
      { title: item.title },
      {
        title: item.title,
        description: item.description,
        thumbnailUrl,
        videoUrl,
        duration: DEMO_DURATION,
        isPublished: true,
        createdBy: adminId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const videoId = video!._id as Types.ObjectId;
    seededVideoIds.push(videoId);

    await questionModel.deleteMany({ videoId });
    await questionModel.insertMany(
      item.questions.map((question) => ({
        videoId,
        timestamp: question.timestamp,
        type: question.type,
        questionText: question.questionText,
        options: question.options,
        correctOptionIndexes: question.correctOptionIndexes,
        correctAnswer: question.correctAnswer,
      })),
    );

    console.log(
      `Seeded video "${item.title}" (${item.questions.length} questions, ${DEMO_DURATION}s)`,
    );
  }

  // Learner 1 gets the first two demo videos so they can watch immediately.
  // Learner 2 is left empty for admin assign experiments.
  const learner1VideoIds = seededVideoIds.slice(0, 2);
  for (const videoId of learner1VideoIds) {
    await assignmentModel.findOneAndUpdate(
      { learnerId: learner1Id, videoId },
      {
        learnerId: learner1Id,
        videoId,
        status: AssignmentStatus.ASSIGNED,
        lastWatchedTimestamp: 0,
        completionPercentage: 0,
        completedAt: null,
        responses: [],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  console.log(
    `Assigned ${learner1VideoIds.length} videos to learner1@example.com (learner2 has none — assign from admin)`,
  );

  await app.close();
  console.log('Seed complete.');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
