import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UploadService } from '../uploads/upload.service';
import { toPublicMediaUrl } from '../uploads/upload.constants';
import { Question, QuestionDocument } from '../questions/schemas/question.schema';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { Video, VideoDocument } from './schemas/video.schema';

@Injectable()
export class VideosService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    private uploadService: UploadService,
  ) {}

  async create(
    dto: CreateVideoDto,
    createdBy: string,
    thumbnail: Express.Multer.File,
    video: Express.Multer.File,
  ) {
    const videoDoc = await this.videoModel.create({
      title: dto.title.trim(),
      description: dto.description.trim(),
      thumbnailUrl: `/uploads/images/${thumbnail.filename}`,
      videoUrl: `/uploads/videos/${video.filename}`,
      duration: dto.duration,
      isPublished: false,
      createdBy: new Types.ObjectId(createdBy),
    });

    return this.toResponse(videoDoc);
  }

  async findAll() {
    const videos = await this.videoModel.find().sort({ createdAt: -1 }).exec();
    return videos.map((video) => this.toResponse(video));
  }

  async findOne(id: string) {
    const video = await this.videoModel.findById(id).exec();
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    return this.toResponse(video);
  }

  async update(
    id: string,
    dto: UpdateVideoDto,
    thumbnail?: Express.Multer.File,
    videoFile?: Express.Multer.File,
  ) {
    const video = await this.videoModel.findById(id).exec();
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (thumbnail) {
      this.uploadService.deleteByUrl(video.thumbnailUrl);
      video.thumbnailUrl = `/uploads/images/${thumbnail.filename}`;
    }
    if (videoFile) {
      this.uploadService.deleteByUrl(video.videoUrl);
      video.videoUrl = `/uploads/videos/${videoFile.filename}`;
    }

    video.title = dto.title?.trim() ?? video.title;
    video.description = dto.description?.trim() ?? video.description;
    video.duration = dto.duration ?? video.duration;
    if (dto.isPublished !== undefined) {
      video.isPublished = dto.isPublished;
    }

    await video.save();
    return this.toResponse(video);
  }

  async setPublished(id: string, isPublished: boolean) {
    return this.update(id, { isPublished });
  }

  async remove(id: string) {
    const video = await this.videoModel.findById(id).exec();
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    this.uploadService.deleteByUrl(video.thumbnailUrl);
    this.uploadService.deleteByUrl(video.videoUrl);
    await this.questionModel.deleteMany({ videoId: video._id }).exec();
    await video.deleteOne();

    return { id: video._id.toString(), deleted: true };
  }

  toResponse(video: VideoDocument) {
    return {
      id: video._id.toString(),
      title: video.title,
      description: video.description,
      thumbnailUrl: toPublicMediaUrl(video.thumbnailUrl),
      videoUrl: toPublicMediaUrl(video.videoUrl),
      duration: video.duration ?? 0,
      isPublished: video.isPublished,
      createdBy: video.createdBy.toString(),
      createdAt: (video as VideoDocument & { createdAt?: Date }).createdAt,
      updatedAt: (video as VideoDocument & { updatedAt?: Date }).updatedAt,
    };
  }
}
