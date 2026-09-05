import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  Assignment,
  AssignmentDocument,
} from '../assignments/schemas/assignment.schema';
import {
  paginated,
  resolvePagination,
  toSearchPattern,
} from '../common/pagination';
import { UploadService } from '../uploads/upload.service';
import { toPublicMediaUrl } from '../uploads/upload.constants';
import { Question, QuestionDocument } from '../questions/schemas/question.schema';
import { CreateVideoDto } from './dto/create-video.dto';
import { ListVideosQueryDto, VideoStatusFilter } from './dto/list-videos-query.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { Video, VideoDocument } from './schemas/video.schema';

@Injectable()
export class VideosService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
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

  async findAll(query: ListVideosQueryDto = {}) {
    const { page, limit, skip } = resolvePagination(query);
    const filter: FilterQuery<VideoDocument> = {};

    if (query.status === VideoStatusFilter.PUBLISHED) {
      filter.isPublished = true;
    } else if (query.status === VideoStatusFilter.DRAFT) {
      filter.isPublished = false;
    }

    const search = query.search?.trim();
    if (search) {
      const pattern = toSearchPattern(search);
      filter.$or = [{ title: pattern }, { description: pattern }];
    }

    if (query.unassignedFor) {
      const assigned = await this.assignmentModel
        .find({ learnerId: new Types.ObjectId(query.unassignedFor) })
        .select('videoId')
        .lean()
        .exec();
      filter._id = { $nin: assigned.map((item) => item.videoId) };
    }

    const [videos, total] = await Promise.all([
      this.videoModel
        .find(filter)
        // _id breaks ties so rows cannot shift between pages.
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.videoModel.countDocuments(filter).exec(),
    ]);

    return paginated(
      videos.map((video) => this.toResponse(video)),
      total,
      page,
      limit,
    );
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
