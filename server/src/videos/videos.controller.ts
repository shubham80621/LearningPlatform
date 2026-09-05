import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { createLessonMediaMulterOptions } from '../uploads/multer.config';
import { UploadExceptionFilter } from '../uploads/upload-exception.filter';
import { MAX_IMAGE_SIZE_BYTES } from '../uploads/upload.constants';
import { CreateVideoDto } from './dto/create-video.dto';
import { ListVideosQueryDto } from './dto/list-videos-query.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideosService } from './videos.service';

type AuthRequest = {
  user: { userId: string; email: string; role: string; name: string };
};

type LessonFiles = {
  thumbnail?: Express.Multer.File[];
  video?: Express.Multer.File[];
};

function firstFile(files: LessonFiles | undefined, field: keyof LessonFiles) {
  return files?.[field]?.[0];
}

function assertThumbnailSize(file?: Express.Multer.File) {
  if (file && file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new BadRequestException('Thumbnail must be 5 MB or smaller.');
  }
}

@ApiTags('videos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(UploadExceptionFilter)
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a video by uploading the thumbnail and video files together.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description', 'duration', 'thumbnail', 'video'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        duration: { type: 'number' },
        thumbnail: { type: 'string', format: 'binary' },
        video: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'thumbnail', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      createLessonMediaMulterOptions(),
    ),
  )
  create(
    @Body() dto: CreateVideoDto,
    @UploadedFiles() files: LessonFiles,
    @Request() req: AuthRequest,
  ) {
    const thumbnail = firstFile(files, 'thumbnail');
    const video = firstFile(files, 'video');
    if (!thumbnail || !video) {
      throw new BadRequestException('Thumbnail and video files are required.');
    }
    assertThumbnailSize(thumbnail);
    return this.videosService.create(dto, req.user.userId, thumbnail, video);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List videos, paginated (admin)',
    description:
      'Returns { items, total, page, limit, totalPages }. Supports search, publish status, and excluding a learner’s existing assignments.',
  })
  findAll(@Query() query: ListVideosQueryDto) {
    return this.videosService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a video by id (admin)' })
  findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update video details and optionally replace media files' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'thumbnail', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      createLessonMediaMulterOptions(),
    ),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVideoDto,
    @UploadedFiles() files: LessonFiles,
  ) {
    const thumbnail = firstFile(files, 'thumbnail');
    const video = firstFile(files, 'video');
    assertThumbnailSize(thumbnail);
    return this.videosService.update(id, dto, thumbnail, video);
  }

  @Post(':id/publish')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Publish a video' })
  publish(@Param('id') id: string) {
    return this.videosService.setPublished(id, true);
  }

  @Post(':id/unpublish')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Unpublish a video' })
  unpublish(@Param('id') id: string) {
    return this.videosService.setPublished(id, false);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a video and its local media files' })
  remove(@Param('id') id: string) {
    return this.videosService.remove(id);
  }
}
