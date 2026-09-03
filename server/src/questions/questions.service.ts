import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VideosService } from '../videos/videos.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import {
  Question,
  QuestionDocument,
  QuestionType,
} from './schemas/question.schema';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    private videosService: VideosService,
  ) {}

  private toVideoObjectId(videoId: string) {
    if (!Types.ObjectId.isValid(videoId)) {
      throw new NotFoundException('Video not found');
    }
    return new Types.ObjectId(videoId);
  }

  async create(videoId: string, dto: CreateQuestionDto) {
    const video = await this.videosService.findOne(videoId);
    this.assertTimestamp(dto.timestamp, video.duration);
    const normalized = this.normalizePayload(dto);

    const question = await this.questionModel.create({
      videoId: this.toVideoObjectId(videoId),
      ...normalized,
    });

    return this.toResponse(question);
  }

  async findByVideo(videoId: string) {
    await this.videosService.findOne(videoId);
    const questions = await this.questionModel
      .find({ videoId: this.toVideoObjectId(videoId) })
      .sort({ timestamp: 1, createdAt: 1 })
      .exec();
    return questions.map((question) => this.toResponse(question));
  }

  async update(videoId: string, id: string, dto: UpdateQuestionDto) {
    const video = await this.videosService.findOne(videoId);
    const question = await this.questionModel
      .findOne({ _id: id, videoId: this.toVideoObjectId(videoId) })
      .exec();
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const nextType = dto.type ?? question.type;
    const merged: CreateQuestionDto = {
      timestamp: dto.timestamp ?? question.timestamp,
      type: nextType,
      questionText: dto.questionText ?? question.questionText,
      options: dto.options ?? question.options,
      correctOptionIndexes: dto.correctOptionIndexes ?? question.correctOptionIndexes,
      correctAnswer: dto.correctAnswer ?? question.correctAnswer,
    };

    this.assertTimestamp(merged.timestamp, video.duration);
    const normalized = this.normalizePayload(merged);

    question.timestamp = normalized.timestamp;
    question.type = normalized.type;
    question.questionText = normalized.questionText;
    question.options = normalized.options;
    question.correctOptionIndexes = normalized.correctOptionIndexes;
    question.correctAnswer = normalized.correctAnswer;
    await question.save();

    return this.toResponse(question);
  }

  async remove(videoId: string, id: string) {
    const result = await this.questionModel
      .findOneAndDelete({ _id: id, videoId: this.toVideoObjectId(videoId) })
      .exec();
    if (!result) {
      throw new NotFoundException('Question not found');
    }
    return { id: result._id.toString(), deleted: true };
  }

  async removeByVideo(videoId: string) {
    await this.questionModel.deleteMany({ videoId: this.toVideoObjectId(videoId) }).exec();
  }

  private assertTimestamp(timestamp: number, duration: number) {
    if (timestamp >= duration) {
      throw new BadRequestException(
        `Timestamp must be within the video duration (${duration} seconds).`,
      );
    }
  }

  private normalizePayload(dto: CreateQuestionDto) {
    const questionText = dto.questionText.trim();
    if (questionText.length < 2) {
      throw new BadRequestException('Question text is required.');
    }

    if (dto.type === QuestionType.SHORT) {
      const correctAnswer = dto.correctAnswer?.trim() ?? '';
      if (!correctAnswer) {
        throw new BadRequestException('A short-answer expected response is required.');
      }
      return {
        timestamp: dto.timestamp,
        type: dto.type,
        questionText,
        options: [],
        correctOptionIndexes: [],
        correctAnswer,
      };
    }

    const options = (dto.options ?? []).map((option) => option.trim()).filter(Boolean);
    if (options.length < 2) {
      throw new BadRequestException('Choice questions need at least 2 options.');
    }

    const indexes = [...new Set(dto.correctOptionIndexes ?? [])];
    if (indexes.some((index) => index < 0 || index >= options.length)) {
      throw new BadRequestException('Correct answers must match an option.');
    }

    if (dto.type === QuestionType.SINGLE && indexes.length !== 1) {
      throw new BadRequestException('Single-choice questions need exactly one correct option.');
    }
    if (dto.type === QuestionType.MULTIPLE && indexes.length < 1) {
      throw new BadRequestException('Multiple-choice questions need at least one correct option.');
    }

    return {
      timestamp: dto.timestamp,
      type: dto.type,
      questionText,
      options,
      correctOptionIndexes: indexes.sort((a, b) => a - b),
      correctAnswer: '',
    };
  }

  toResponse(question: QuestionDocument) {
    return {
      id: question._id.toString(),
      videoId: question.videoId.toString(),
      timestamp: question.timestamp,
      type: question.type,
      questionText: question.questionText,
      options: question.options,
      correctOptionIndexes: question.correctOptionIndexes,
      correctAnswer: question.correctAnswer,
      createdAt: (question as QuestionDocument & { createdAt?: Date }).createdAt,
      updatedAt: (question as QuestionDocument & { updatedAt?: Date }).updatedAt,
    };
  }
}
