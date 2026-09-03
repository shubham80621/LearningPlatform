import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type QuestionDocument = HydratedDocument<Question>;

export enum QuestionType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
  SHORT = 'short',
}

@Schema({ timestamps: true })
export class Question {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Video', required: true, index: true })
  videoId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  timestamp: number;

  @Prop({ required: true, enum: QuestionType })
  type: QuestionType;

  @Prop({ required: true, trim: true })
  questionText: string;

  @Prop({ type: [String], default: [] })
  options: string[];

  /** Option indexes that are correct. Used for single and multiple choice. */
  @Prop({ type: [Number], default: [] })
  correctOptionIndexes: number[];

  /** Expected text for short-answer questions. */
  @Prop({ default: '', trim: true })
  correctAnswer: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
QuestionSchema.index({ videoId: 1, timestamp: 1 });
