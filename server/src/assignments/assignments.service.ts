import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Question,
  QuestionDocument,
  QuestionType,
} from '../questions/schemas/question.schema';
import { toPublicMediaUrl } from '../uploads/upload.constants';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { Video, VideoDocument } from '../videos/schemas/video.schema';
import { CreateAssignmentsDto } from './dto/create-assignments.dto';
import {
  Assignment,
  AssignmentDocument,
  AssignmentStatus,
} from './schemas/assignment.schema';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
  ) {}

  async assignToLearner(dto: CreateAssignmentsDto) {
    const learner = await this.userModel
      .findOne({ _id: dto.learnerId, role: UserRole.LEARNER })
      .exec();
    if (!learner) {
      throw new NotFoundException('Learner not found');
    }

    const uniqueVideoIds = [...new Set(dto.videoIds)];
    const videos = await this.videoModel
      .find({ _id: { $in: uniqueVideoIds } })
      .exec();

    if (videos.length !== uniqueVideoIds.length) {
      throw new BadRequestException('One or more videos were not found');
    }

    const unpublished = videos.filter((video) => !video.isPublished);
    if (unpublished.length > 0) {
      throw new BadRequestException(
        'Only published videos can be assigned to learners',
      );
    }

    const learnerObjectId = new Types.ObjectId(dto.learnerId);
    const created: AssignmentDocument[] = [];

    for (const video of videos) {
      const existing = await this.assignmentModel
        .findOne({ learnerId: learnerObjectId, videoId: video._id })
        .exec();
      if (existing) {
        continue;
      }

      const assignment = await this.assignmentModel.create({
        learnerId: learnerObjectId,
        videoId: video._id,
        status: AssignmentStatus.ASSIGNED,
        lastWatchedTimestamp: 0,
        completionPercentage: 0,
        responses: [],
      });
      created.push(assignment);
    }

    if (created.length === 0) {
      throw new ConflictException(
        'All selected videos are already assigned to this learner',
      );
    }

    return this.findByLearner(dto.learnerId);
  }

  async findByLearner(learnerId: string) {
    const { assignments, videoMap, questionsByVideo } =
      await this.loadLearnerAssignments(learnerId);

    return assignments.map((assignment) =>
      this.toDetailedResponse(
        assignment,
        videoMap.get(assignment.videoId.toString()),
        questionsByVideo.get(assignment.videoId.toString()) ?? [],
      ),
    );
  }

  /** Learner home feed: published assigned videos only, no answer keys. */
  async findMine(learnerId: string) {
    const { assignments, videoMap, questionsByVideo } =
      await this.loadLearnerAssignments(learnerId);

    return assignments
      .map((assignment) => {
        const video = videoMap.get(assignment.videoId.toString());
        if (!video?.isPublished) return null;
        const questions =
          questionsByVideo.get(assignment.videoId.toString()) ?? [];
        const questionIds = new Set(
          questions.map((question) => question._id.toString()),
        );
        const matchedResponses = (assignment.responses ?? []).filter((response) =>
          questionIds.has(response.questionId.toString()),
        );
        const answered = matchedResponses.length;
        const correct = matchedResponses.filter(
          (response) => response.isCorrect === true,
        ).length;
        const incorrect = matchedResponses.filter(
          (response) => response.isCorrect === false,
        ).length;
        const totalQuestions = questions.length;
        const unanswered = Math.max(totalQuestions - answered, 0);

        return {
          id: assignment._id.toString(),
          videoId: assignment.videoId.toString(),
          status: assignment.status,
          lastWatchedTimestamp: assignment.lastWatchedTimestamp,
          completionPercentage: assignment.completionPercentage,
          questionCount: totalQuestions,
          answeredCount: answered,
          stats: {
            totalQuestions,
            answered,
            unanswered,
            correct,
            incorrect,
          },
          createdAt: (assignment as AssignmentDocument & { createdAt?: Date })
            .createdAt,
          video: {
            id: video._id.toString(),
            title: video.title,
            description: video.description,
            thumbnailUrl: toPublicMediaUrl(video.thumbnailUrl),
            duration: video.duration,
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  private async loadLearnerAssignments(learnerId: string) {
    const learner = await this.userModel
      .findOne({ _id: learnerId, role: UserRole.LEARNER })
      .exec();
    if (!learner) {
      throw new NotFoundException('Learner not found');
    }

    const assignments = await this.assignmentModel
      .find({ learnerId: new Types.ObjectId(learnerId) })
      .sort({ createdAt: 1 })
      .exec();

    const videoIds = assignments.map(
      (item) => new Types.ObjectId(item.videoId.toString()),
    );
    const [videos, questions] = await Promise.all([
      this.videoModel.find({ _id: { $in: videoIds } }).exec(),
      this.questionModel
        .find({ videoId: { $in: videoIds } })
        .sort({ timestamp: 1 })
        .exec(),
    ]);

    const videoMap = new Map(
      videos.map((video) => [video._id.toString(), video]),
    );
    const questionsByVideo = new Map<string, QuestionDocument[]>();
    for (const question of questions) {
      const key = question.videoId.toString();
      const list = questionsByVideo.get(key) ?? [];
      list.push(question);
      questionsByVideo.set(key, list);
    }

    return { assignments, videoMap, questionsByVideo };
  }

  async remove(id: string) {
    const assignment = await this.assignmentModel.findByIdAndDelete(id).exec();
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    return { id };
  }

  private toDetailedResponse(
    assignment: AssignmentDocument,
    video: VideoDocument | undefined,
    questions: QuestionDocument[],
  ) {
    const responseByQuestion = new Map(
      (assignment.responses ?? []).map((response) => [
        response.questionId.toString(),
        response,
      ]),
    );

    const questionRows = questions.map((question) => {
      const response = responseByQuestion.get(question._id.toString());
      const learnerAnswer = response
        ? this.formatLearnerAnswer(question, response)
        : null;
      const correctAnswer = this.formatCorrectAnswer(question);

      return {
        questionId: question._id.toString(),
        timestamp: question.timestamp,
        type: question.type,
        questionText: question.questionText,
        options: question.options,
        correctAnswer,
        answered: Boolean(response),
        isCorrect: response?.isCorrect ?? null,
        learnerAnswer,
        answeredAt: response?.answeredAt ?? null,
      };
    });

    // Keep orphaned responses if questions were deleted after answering
    for (const response of assignment.responses ?? []) {
      const qid = response.questionId.toString();
      if (questionRows.some((row) => row.questionId === qid)) continue;
      questionRows.push({
        questionId: qid,
        timestamp: 0,
        type: QuestionType.SHORT,
        questionText: 'Question no longer available',
        options: [],
        correctAnswer: '—',
        answered: true,
        isCorrect: response.isCorrect,
        learnerAnswer:
          response.shortAnswer ||
          (response.selectedOptionIndexes?.length
            ? `Options: ${response.selectedOptionIndexes.join(', ')}`
            : '—'),
        answeredAt: response.answeredAt ?? null,
      });
    }

    const answered = questionRows.filter((row) => row.answered).length;
    const correct = questionRows.filter((row) => row.isCorrect === true).length;
    const incorrect = questionRows.filter((row) => row.isCorrect === false).length;
    const totalQuestions = questions.length;
    const unanswered = Math.max(totalQuestions - answered, 0);

    return {
      id: assignment._id.toString(),
      learnerId: assignment.learnerId.toString(),
      videoId: assignment.videoId.toString(),
      status: assignment.status,
      lastWatchedTimestamp: assignment.lastWatchedTimestamp,
      completionPercentage: assignment.completionPercentage,
      responseCount: assignment.responses?.length ?? 0,
      createdAt: (assignment as AssignmentDocument & { createdAt?: Date })
        .createdAt,
      stats: {
        totalQuestions,
        answered,
        unanswered,
        correct,
        incorrect,
      },
      questions: questionRows,
      video: video
        ? {
            id: video._id.toString(),
            title: video.title,
            thumbnailUrl: toPublicMediaUrl(video.thumbnailUrl),
            duration: video.duration,
            isPublished: video.isPublished,
          }
        : null,
    };
  }

  private formatLearnerAnswer(
    question: QuestionDocument,
    response: AssignmentDocument['responses'][number],
  ) {
    if (question.type === 'short') {
      return response.shortAnswer?.trim() || '—';
    }
    const indexes = response.selectedOptionIndexes ?? [];
    if (indexes.length === 0) return '—';
    return indexes
      .map((index) => question.options[index] ?? `Option ${index + 1}`)
      .join(', ');
  }

  private formatCorrectAnswer(question: QuestionDocument) {
    if (question.type === 'short') {
      return question.correctAnswer?.trim() || '—';
    }
    const indexes = question.correctOptionIndexes ?? [];
    if (indexes.length === 0) return '—';
    return indexes
      .map((index) => question.options[index] ?? `Option ${index + 1}`)
      .join(', ');
  }
}
