import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import {
  Assignment,
  AssignmentDocument,
  AssignmentStatus,
} from '../assignments/schemas/assignment.schema';
import {
  Question,
  QuestionDocument,
} from '../questions/schemas/question.schema';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { CreateLearnerDto } from './dto/create-learner.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
  ) {}

  create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
  }) {
    return this.userModel.create(data);
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findById(id: string) {
    return this.userModel.findById(id).select('-passwordHash').exec();
  }

  findLearners() {
    return this.userModel
      .find({ role: UserRole.LEARNER })
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .exec();
  }

  async listLearnersWithStats() {
    const learners = await this.findLearners();
    if (learners.length === 0) return [];

    const learnerIds = learners.map((learner) => learner._id);
    const assignments = await this.assignmentModel
      .find({ learnerId: { $in: learnerIds } })
      .exec();

    const videoIds = [
      ...new Set(assignments.map((item) => item.videoId.toString())),
    ].map((id) => new Types.ObjectId(id));

    const questionCounts = await this.questionModel.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      { $match: { videoId: { $in: videoIds } } },
      { $group: { _id: '$videoId', count: { $sum: 1 } } },
    ]);

    const questionsByVideo = new Map(
      questionCounts.map((row) => [row._id.toString(), row.count]),
    );

    const statsByLearner = new Map<
      string,
      { assignedVideos: number; questions: number; completed: number }
    >();

    for (const assignment of assignments) {
      const learnerId = assignment.learnerId.toString();
      const current = statsByLearner.get(learnerId) ?? {
        assignedVideos: 0,
        questions: 0,
        completed: 0,
      };
      current.assignedVideos += 1;
      current.questions +=
        questionsByVideo.get(assignment.videoId.toString()) ?? 0;
      if (assignment.status === AssignmentStatus.COMPLETED) {
        current.completed += 1;
      }
      statsByLearner.set(learnerId, current);
    }

    return learners.map((learner) => {
      const id = learner._id.toString();
      const stats = statsByLearner.get(id) ?? {
        assignedVideos: 0,
        questions: 0,
        completed: 0,
      };
      return {
        ...this.toSafeUser(learner),
        assignedVideos: stats.assignedVideos,
        questions: stats.questions,
        completed: stats.completed,
      };
    });
  }

  async createLearner(dto: CreateLearnerDto) {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      role: UserRole.LEARNER,
    });

    return this.toSafeUser(user);
  }

  async findLearnerById(id: string) {
    const user = await this.userModel
      .findOne({ _id: id, role: UserRole.LEARNER })
      .select('-passwordHash')
      .exec();

    if (!user) {
      throw new NotFoundException('Learner not found');
    }

    return this.toSafeUser(user);
  }

  async updateLearner(
    id: string,
    dto: { name?: string; email?: string; password?: string },
  ) {
    const user = await this.userModel
      .findOne({ _id: id, role: UserRole.LEARNER })
      .exec();

    if (!user) {
      throw new NotFoundException('Learner not found');
    }

    if (dto.email) {
      const email = dto.email.toLowerCase().trim();
      const existing = await this.userModel
        .findOne({ email, _id: { $ne: user._id } })
        .exec();
      if (existing) {
        throw new ConflictException('Email is already registered');
      }
      user.email = email;
    }

    if (dto.name?.trim()) {
      user.name = dto.name.trim();
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    await user.save();
    return this.toSafeUser(user);
  }

  toSafeUser(user: UserDocument) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: (user as UserDocument & { createdAt?: Date }).createdAt,
    };
  }
}
