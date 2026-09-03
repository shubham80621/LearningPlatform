import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { CreateLearnerDto } from './dto/create-learner.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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
