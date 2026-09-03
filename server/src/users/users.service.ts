import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';

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
      .exec();
  }
}
