import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsService } from './questions.service';

@ApiTags('questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('videos/:videoId/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a timestamp question to a video' })
  create(
    @Param('videoId') videoId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(videoId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List questions for a video' })
  findAll(@Param('videoId') videoId: string) {
    return this.questionsService.findByVideo(videoId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a video question' })
  update(
    @Param('videoId') videoId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(videoId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a video question' })
  remove(@Param('videoId') videoId: string, @Param('id') id: string) {
    return this.questionsService.remove(videoId, id);
  }
}
