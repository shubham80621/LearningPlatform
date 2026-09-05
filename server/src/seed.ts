import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Model, Types } from 'mongoose';
import {
  Assignment,
  AssignmentSchema,
  AssignmentStatus,
} from './assignments/schemas/assignment.schema';
import {
  Question,
  QuestionDocument,
  QuestionSchema,
  QuestionType,
} from './questions/schemas/question.schema';
import { IMAGE_UPLOAD_DIR, VIDEO_UPLOAD_DIR } from './uploads/upload.constants';
import { User, UserRole, UserSchema } from './users/schemas/user.schema';
import { Video, VideoSchema } from './videos/schemas/video.schema';

/**
 * Demo clip lives in server/seed-assets/videos/ (committed) and is copied
 * into uploads/videos/ on each seed run. Every seeded lesson reuses it.
 */
const DEMO_VIDEO_FILE = 'demo.mov';
/**
 * Thumbnails live in server/seed-assets/thumbnails/ (committed) and are
 * copied into uploads/images/ on each seed run.
 */
const DEMO_THUMBS = [
  'handwriting-skills.png',
  'learn-everything-fast.png',
  'online-course.jpg',
] as const;
const SEED_ASSETS_DIR = join(__dirname, '..', 'seed-assets');
const SEED_THUMB_DIR = join(SEED_ASSETS_DIR, 'thumbnails');
const SEED_VIDEO_DIR = join(SEED_ASSETS_DIR, 'videos');
/** Known duration of the demo .mov (seconds). */
const DEMO_DURATION = 31;

function ensureDemoMedia() {
  mkdirSync(IMAGE_UPLOAD_DIR, { recursive: true });
  mkdirSync(VIDEO_UPLOAD_DIR, { recursive: true });

  const videoSource = join(SEED_VIDEO_DIR, DEMO_VIDEO_FILE);
  if (!existsSync(videoSource)) {
    throw new Error(
      `Seed video missing at seed-assets/videos/${DEMO_VIDEO_FILE}.`,
    );
  }
  copyFileSync(videoSource, join(VIDEO_UPLOAD_DIR, DEMO_VIDEO_FILE));

  for (const thumb of DEMO_THUMBS) {
    const source = join(SEED_THUMB_DIR, thumb);
    if (!existsSync(source)) {
      throw new Error(
        `Seed thumbnail missing at seed-assets/thumbnails/${thumb}.`,
      );
    }
    copyFileSync(source, join(IMAGE_UPLOAD_DIR, thumb));
  }
}

/**
 * Volume knobs. Sized so every paginated list needs more than one page:
 * learners (8/page), videos (8/page), assignable videos (6/page),
 * progress rows (5/page).
 */
const LEARNER_COUNT = 14;
/** The first video carries a deep question set to stress the questions panel. */
const DEEP_QUESTION_COUNT = 15;
const DEFAULT_QUESTION_COUNT = 3;
/** Last two videos stay drafts so the published/draft states are both visible. */
const DRAFT_TAIL_COUNT = 2;

type QuestionBody = {
  type: QuestionType;
  questionText: string;
  options: string[];
  correctOptionIndexes: number[];
  correctAnswer: string;
};

type QuestionSeed = QuestionBody & { timestamp: number };

type SeedVideo = {
  title: string;
  description: string;
  /** Hand-written questions; the rest are filled from templates. */
  questions?: QuestionBody[];
};

const SEED_VIDEOS: SeedVideo[] = [
  {
    title: 'Getting Started with LearnPulse',
    description:
      'A short orientation lesson. Pause when questions appear and answer before continuing.',
    questions: [
      {
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
    questions: [
      {
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
    questions: [
      {
        type: QuestionType.SINGLE,
        questionText: 'How many times can you submit an answer for a question?',
        options: ['Unlimited', 'Once', 'Three times', 'Only after rewatching'],
        correctOptionIndexes: [1],
        correctAnswer: '',
      },
      {
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
        type: QuestionType.SHORT,
        questionText: 'Spell the word for a timed quiz prompt (8 letters).',
        options: [],
        correctOptionIndexes: [],
        correctAnswer: 'question',
      },
    ],
  },
  {
    title: 'Navigating Your Learner Dashboard',
    description: 'Find assigned lessons, continue watching, and read your progress ring.',
  },
  {
    title: 'Resuming a Lesson Where You Left Off',
    description: 'How saved playback position works when you close and reopen a lesson.',
  },
  {
    title: 'Understanding Lesson Statuses',
    description: 'Not started, in progress, and completed — what moves a lesson forward.',
  },
  {
    title: 'Answering Single-Choice Questions',
    description: 'Pick one option, submit, and review the correct answer reveal.',
  },
  {
    title: 'Answering Multiple-Choice Questions',
    description: 'Select every option that applies before submitting your answer.',
  },
  {
    title: 'Writing Short Answers',
    description: 'Free-text responses and how they are graded against the expected answer.',
  },
  {
    title: 'Tracking Your Own Progress',
    description: 'Read completion percentages and see which lessons still need work.',
  },
  {
    title: 'Using Search to Find a Lesson',
    description: 'Filter your assigned lessons by title when the list grows long.',
  },
  {
    title: 'Watching on a Small Screen',
    description: 'Mobile layout, bottom navigation, and the compact player.',
  },
  {
    title: 'Player Controls Walkthrough',
    description: 'Play, pause, seek, and how each control affects saved progress.',
  },
  {
    title: 'Uploading Your First Video',
    description: 'Admin walkthrough for picking a file and a thumbnail.',
  },
  {
    title: 'Writing Good Lesson Descriptions',
    description: 'Give learners enough context to know why a lesson was assigned.',
  },
  {
    title: 'Choosing an Effective Thumbnail',
    description: 'Thumbnail sizing, aspect ratio, and what reads well in the grid.',
  },
  {
    title: 'Publishing and Unpublishing Lessons',
    description: 'Drafts stay hidden from learners until you publish them.',
  },
  {
    title: 'Adding Timestamp Questions',
    description: 'Attach a question to a moment in the video so playback pauses there.',
  },
  {
    title: 'Editing and Removing Questions',
    description: 'Update wording or answers without losing existing learner history.',
  },
  {
    title: 'Creating Learner Accounts',
    description: 'Add a learner, set the starting password, and share the login.',
  },
  {
    title: 'Assigning Lessons to Learners',
    description: 'Assign published lessons and confirm they appear on the learner side.',
  },
  {
    title: 'Reviewing Learner Progress',
    description: 'Open a learner and read per-lesson progress and answer history.',
  },
  {
    title: 'Reading Completion Metrics',
    description: 'What counts as complete and when the completion date is recorded.',
  },
  {
    title: 'Handling Incomplete Assignments',
    description: 'Spot stalled lessons and follow up with the right learner.',
  },
  {
    title: 'Role-Based Access Explained',
    description: 'Why admin routes stay locked for learner accounts.',
  },
  {
    title: 'Keeping Media Files Organized',
    description: 'Where uploaded videos and images are stored and served from.',
  },
  {
    title: 'Upload Limits and File Types',
    description: 'Accepted formats and the maximum size the server will take.',
  },
  {
    title: 'Designing a Short Assessment',
    description: 'Balance question count against lesson length so pacing stays sane.',
  },
  {
    title: 'Common Authoring Mistakes',
    description: 'Timestamps past the end, missing answers, and other easy slips.',
  },
  {
    title: 'Wrapping Up: Platform Recap',
    description: 'A quick recap of the admin and learner journeys end to end.',
  },
];

const VIDEO_COUNT = SEED_VIDEOS.length;

/** Cycled to fill any video that has no hand-written questions. */
const QUESTION_TEMPLATES: Array<(title: string) => QuestionBody> = [
  (title) => ({
    type: QuestionType.SINGLE,
    questionText: `What is “${title}” mainly about?`,
    options: [
      'Editing photos',
      `The subject covered in “${title}”`,
      'Booking meeting rooms',
      'Something unrelated to this course',
    ],
    correctOptionIndexes: [1],
    correctAnswer: '',
  }),
  (title) => ({
    type: QuestionType.MULTIPLE,
    questionText: `Which of these are true for “${title}”? (select all that apply)`,
    options: [
      'It belongs to an assigned learning path',
      'Playback can pause for timestamp questions',
      'Finishing it deletes your account',
      'Your progress is saved as you watch',
    ],
    correctOptionIndexes: [0, 1, 3],
    correctAnswer: '',
  }),
  () => ({
    type: QuestionType.SHORT,
    questionText: 'Type the status a lesson reaches once you finish it (one word).',
    options: [],
    correctOptionIndexes: [],
    correctAnswer: 'completed',
  }),
  () => ({
    type: QuestionType.SINGLE,
    questionText: 'Where does the player resume when you reopen a lesson?',
    options: [
      'At the very beginning',
      'At your last saved position',
      'At the end of the video',
      'At a random point',
    ],
    correctOptionIndexes: [1],
    correctAnswer: '',
  }),
  () => ({
    type: QuestionType.MULTIPLE,
    questionText: 'Which answer types can a question use?',
    options: ['Single choice', 'Multiple choice', 'Short text', 'Voice note'],
    correctOptionIndexes: [0, 1, 2],
    correctAnswer: '',
  }),
  () => ({
    type: QuestionType.SHORT,
    questionText: 'Type the product name shown in the app header (one word).',
    options: [],
    correctOptionIndexes: [],
    correctAnswer: 'LearnPulse',
  }),
];

const LEARNER_NAMES = [
  'Aarav Sharma',
  'Priya Nair',
  'Rahul Verma',
  'Sara Khan',
  'Ishaan Gupta',
  'Meera Iyer',
  'Kabir Singh',
  'Ananya Rao',
  'Vivek Menon',
  'Divya Pillai',
  'Arjun Patel',
  'Neha Joshi',
  'Rohan Das',
  'Tara Bose',
];

type SeedState = 'assigned' | 'in_progress' | 'completed';

/** Spread timestamps evenly inside the clip, strictly increasing. */
function spreadTimestamps(count: number, duration: number): number[] {
  const first = 2;
  const last = Math.max(first, duration - 2);
  const step = count > 1 ? (last - first) / (count - 1) : 0;
  const out: number[] = [];

  for (let i = 0; i < count; i++) {
    const raw = Math.round(first + i * step);
    const previous = out[out.length - 1];
    const next = previous === undefined ? raw : Math.max(raw, previous + 1);
    out.push(Math.min(next, duration - 1));
  }

  return out;
}

function buildQuestions(video: SeedVideo, count: number): QuestionSeed[] {
  const bodies: QuestionBody[] = [...(video.questions ?? [])];

  for (let i = bodies.length; i < count; i++) {
    bodies.push(QUESTION_TEMPLATES[i % QUESTION_TEMPLATES.length](video.title));
  }

  const timestamps = spreadTimestamps(count, DEMO_DURATION);
  return bodies
    .slice(0, count)
    .map((body, index) => ({ ...body, timestamp: timestamps[index] }));
}

/**
 * Who gets what. learner1 is the demo account and carries every status so the
 * progress tab needs three pages; learner2 stays fresh for a live assign demo;
 * learners 9-14 have nothing so the empty state is reachable.
 */
function planFor(learnerIndex: number): Array<{ video: number; state: SeedState }> {
  if (learnerIndex === 0) {
    return [
      { video: 0, state: 'completed' },
      { video: 1, state: 'completed' },
      { video: 2, state: 'completed' },
      { video: 3, state: 'in_progress' },
      { video: 4, state: 'in_progress' },
      { video: 5, state: 'in_progress' },
      { video: 6, state: 'in_progress' },
      { video: 7, state: 'assigned' },
      { video: 8, state: 'assigned' },
      { video: 9, state: 'assigned' },
      { video: 10, state: 'assigned' },
      { video: 11, state: 'assigned' },
    ];
  }

  if (learnerIndex === 1) {
    return [
      { video: 12, state: 'assigned' },
      { video: 13, state: 'assigned' },
      { video: 14, state: 'assigned' },
    ];
  }

  if (learnerIndex <= 7) {
    const start = (learnerIndex * 3) % VIDEO_COUNT;
    return [
      { video: start, state: 'completed' },
      { video: (start + 1) % VIDEO_COUNT, state: 'in_progress' },
    ];
  }

  return [];
}

/** Partial watch positions for in-progress rows, kept under the 95% threshold. */
const IN_PROGRESS_FRACTIONS = [0.35, 0.5, 0.65, 0.8];

function answerFor(question: QuestionDocument, correct: boolean) {
  if (question.type === QuestionType.SHORT) {
    return {
      questionId: question._id as Types.ObjectId,
      selectedOptionIndexes: [],
      shortAnswer: correct ? question.correctAnswer : 'not sure',
      isCorrect: correct,
      answeredAt: new Date(),
    };
  }

  const wrongIndex = question.options.findIndex(
    (_, index) => !question.correctOptionIndexes.includes(index),
  );

  return {
    questionId: question._id as Types.ObjectId,
    selectedOptionIndexes: correct
      ? question.correctOptionIndexes
      : wrongIndex >= 0
        ? [wrongIndex]
        : [],
    shortAnswer: '',
    isCorrect: correct,
    answeredAt: new Date(),
  };
}

function buildResponses(
  questions: QuestionDocument[],
  state: SeedState,
  watchedUpTo: number,
) {
  if (state === 'assigned') return [];

  const answerable =
    state === 'completed'
      ? questions
      : questions.filter((question) => question.timestamp <= watchedUpTo);

  // One wrong answer on in-progress rows so the admin view is not all green.
  return answerable.map((question, index) =>
    answerFor(question, !(state === 'in_progress' && index === 0)),
  );
}

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
  ensureDemoMedia();

  const app = await NestFactory.createApplicationContext(SeedModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const videoModel = app.get<Model<Video>>(getModelToken(Video.name));
  const questionModel = app.get<Model<Question>>(getModelToken(Question.name));
  const assignmentModel = app.get<Model<Assignment>>(
    getModelToken(Assignment.name),
  );

  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await userModel.findOneAndUpdate(
    { email: 'admin@example.com' },
    {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
    { upsert: true, new: true },
  );
  const adminId = admin!._id as Types.ObjectId;
  console.log('Seeded admin: admin@example.com / admin123');

  // Older seeds created this alias; drop it so the learner count stays exact.
  const legacy = await userModel.findOne({ email: 'learner@example.com' }).exec();
  if (legacy) {
    await assignmentModel.deleteMany({ learnerId: legacy._id });
    await userModel.deleteOne({ _id: legacy._id });
    console.log('Removed legacy learner@example.com from an earlier seed');
  }

  const learnerPasswordHash = await bcrypt.hash('learner123', 10);
  const learnerIds: Types.ObjectId[] = [];

  for (let i = 0; i < LEARNER_COUNT; i++) {
    const email = `learner${i + 1}@example.com`;
    const learner = await userModel.findOneAndUpdate(
      { email },
      {
        name: LEARNER_NAMES[i % LEARNER_NAMES.length],
        email,
        passwordHash: learnerPasswordHash,
        role: UserRole.LEARNER,
      },
      { upsert: true, new: true },
    );
    learnerIds.push(learner!._id as Types.ObjectId);
  }
  console.log(
    `Seeded ${LEARNER_COUNT} learners: learner1@example.com … learner${LEARNER_COUNT}@example.com / learner123`,
  );

  const videoUrl = `/uploads/videos/${DEMO_VIDEO_FILE}`;
  const videoIds: Types.ObjectId[] = [];
  const questionsByVideo: QuestionDocument[][] = [];
  let questionTotal = 0;

  for (const [index, item] of SEED_VIDEOS.entries()) {
    const isDraft = index >= VIDEO_COUNT - DRAFT_TAIL_COUNT;
    const video = await videoModel.findOneAndUpdate(
      { title: item.title },
      {
        title: item.title,
        description: item.description,
        thumbnailUrl: `/uploads/images/${DEMO_THUMBS[index % DEMO_THUMBS.length]}`,
        videoUrl,
        duration: DEMO_DURATION,
        isPublished: !isDraft,
        createdBy: adminId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const videoId = video!._id as Types.ObjectId;
    videoIds.push(videoId);

    const seeds = buildQuestions(
      item,
      index === 0 ? DEEP_QUESTION_COUNT : DEFAULT_QUESTION_COUNT,
    );

    await questionModel.deleteMany({ videoId });
    const created = (await questionModel.insertMany(
      seeds.map((question) => ({ ...question, videoId })),
    )) as unknown as QuestionDocument[];

    questionsByVideo.push(created);
    questionTotal += created.length;
  }

  console.log(
    `Seeded ${VIDEO_COUNT} videos (${DRAFT_TAIL_COUNT} drafts) and ${questionTotal} questions; "${SEED_VIDEOS[0].title}" has ${DEEP_QUESTION_COUNT}`,
  );

  let assignmentTotal = 0;
  const statusTotals: Record<SeedState, number> = {
    assigned: 0,
    in_progress: 0,
    completed: 0,
  };

  for (const [learnerIndex, learnerId] of learnerIds.entries()) {
    const plan = planFor(learnerIndex);
    let inProgressSeen = 0;

    for (const entry of plan) {
      const questions = questionsByVideo[entry.video];
      let watched = 0;
      let percentage = 0;
      let completedAt: Date | null = null;

      if (entry.state === 'completed') {
        watched = DEMO_DURATION;
        percentage = 100;
        completedAt = new Date(Date.now() - (learnerIndex + 1) * 86_400_000);
      } else if (entry.state === 'in_progress') {
        const fraction =
          IN_PROGRESS_FRACTIONS[inProgressSeen % IN_PROGRESS_FRACTIONS.length];
        inProgressSeen += 1;
        watched = Math.round(DEMO_DURATION * fraction);
        percentage = Math.round((watched / DEMO_DURATION) * 100);
      }

      await assignmentModel.findOneAndUpdate(
        { learnerId, videoId: videoIds[entry.video] },
        {
          learnerId,
          videoId: videoIds[entry.video],
          status:
            entry.state === 'completed'
              ? AssignmentStatus.COMPLETED
              : entry.state === 'in_progress'
                ? AssignmentStatus.IN_PROGRESS
                : AssignmentStatus.ASSIGNED,
          lastWatchedTimestamp: watched,
          completionPercentage: percentage,
          completedAt,
          responses: buildResponses(questions, entry.state, watched),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      statusTotals[entry.state] += 1;
      assignmentTotal += 1;
    }
  }

  console.log(
    `Seeded ${assignmentTotal} assignments (${statusTotals.completed} completed, ${statusTotals.in_progress} in progress, ${statusTotals.assigned} not started)`,
  );

  await app.close();
  console.log('Seed complete.');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
