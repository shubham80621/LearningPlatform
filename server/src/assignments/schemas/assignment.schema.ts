import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AssignmentDocument = HydratedDocument<Assignment>;

export enum AssignmentStatus {
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Schema({ _id: false })
export class AssignmentResponse {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId: Types.ObjectId;

  @Prop({ type: [Number], default: [] })
  selectedOptionIndexes: number[];

  @Prop({ default: '' })
  shortAnswer: string;

  @Prop({ default: false })
  isCorrect: boolean;

  @Prop({ type: Date, default: Date.now })
  answeredAt: Date;
}

export const AssignmentResponseSchema =
  SchemaFactory.createForClass(AssignmentResponse);

@Schema({ timestamps: true })
export class Assignment {
  @Prop({ type: Types.ObjectId, ref: 'Video', required: true, index: true })
  videoId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  learnerId: Types.ObjectId;

  @Prop({
    type: String,
    enum: AssignmentStatus,
    default: AssignmentStatus.ASSIGNED,
  })
  status: AssignmentStatus;

  @Prop({ default: 0, min: 0 })
  lastWatchedTimestamp: number;

  @Prop({ default: 0, min: 0, max: 100 })
  completionPercentage: number;

  /** Set when status becomes completed (watch threshold + all questions answered). */
  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: [AssignmentResponseSchema], default: [] })
  responses: AssignmentResponse[];
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);

AssignmentSchema.index({ learnerId: 1, videoId: 1 }, { unique: true });
