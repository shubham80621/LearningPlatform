import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VideoDocument = HydratedDocument<Video>;

@Schema({ timestamps: true })
export class Video {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '', trim: true })
  description: string;

  /** Public URL of the thumbnail (local /uploads/... for now; later S3/CloudFront). */
  @Prop({ required: true, trim: true })
  thumbnailUrl: string;

  /** Public URL of the video file (local /uploads/... for now; later S3/CloudFront). */
  @Prop({ required: true, trim: true })
  videoUrl: string;

  /** Duration in seconds. Used later to validate question timestamps. */
  @Prop({ required: true, min: 1 })
  duration: number;

  @Prop({ default: false })
  isPublished: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const VideoSchema = SchemaFactory.createForClass(Video);
