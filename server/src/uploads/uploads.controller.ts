import {
  BadRequestException,
  Controller,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { createMulterOptions } from './multer.config';
import { UploadExceptionFilter } from './upload-exception.filter';
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
} from './upload.constants';
import { UploadService } from './upload.service';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseFilters(UploadExceptionFilter)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({
    summary: `Upload an image (thumbnail). Max ${Math.round(MAX_IMAGE_SIZE_BYTES / 1024 / 1024)} MB.`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', createMulterOptions('image')))
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        exceptionFactory: () =>
          new BadRequestException('An image file is required'),
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadService.toStoredUpload(file, 'image');
  }

  @Post('video')
  @ApiOperation({
    summary: `Upload a video file. Max ${Math.round(MAX_VIDEO_SIZE_BYTES / 1024 / 1024)} MB. Larger files should use S3 presigned uploads later.`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', createMulterOptions('video')))
  uploadVideo(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        exceptionFactory: () =>
          new BadRequestException('A video file is required'),
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadService.toStoredUpload(file, 'video');
  }
}
