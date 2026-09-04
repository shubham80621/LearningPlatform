import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentsDto } from './dto/create-assignments.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

type AuthRequest = {
  user: { userId: string; email: string; role: string; name: string };
};

@ApiTags('assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Assign one or more published videos to a learner',
  })
  assign(@Body() dto: CreateAssignmentsDto) {
    return this.assignmentsService.assignToLearner(dto);
  }

  @Get('me')
  @Roles(UserRole.LEARNER)
  @ApiOperation({ summary: 'List my assigned videos (learner home feed)' })
  listMine(@Request() req: AuthRequest) {
    return this.assignmentsService.findMine(req.user.userId);
  }

  @Get('me/:id')
  @Roles(UserRole.LEARNER)
  @ApiOperation({ summary: 'Get an assigned video for watching (learner)' })
  getMine(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.assignmentsService.getMineById(req.user.userId, id);
  }

  @Patch('me/:id/progress')
  @Roles(UserRole.LEARNER)
  @ApiOperation({ summary: 'Save watch progress (learner)' })
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
    @Request() req: AuthRequest,
  ) {
    return this.assignmentsService.updateProgress(req.user.userId, id, dto);
  }

  @Post('me/:id/answers')
  @Roles(UserRole.LEARNER)
  @ApiOperation({ summary: 'Submit a quiz answer (learner)' })
  submitAnswer(
    @Param('id') id: string,
    @Body() dto: SubmitAnswerDto,
    @Request() req: AuthRequest,
  ) {
    return this.assignmentsService.submitAnswer(req.user.userId, id, dto);
  }

  @Get('learner/:learnerId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List assignments for a learner (admin)' })
  listForLearner(@Param('learnerId') learnerId: string) {
    return this.assignmentsService.findByLearner(learnerId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove an assignment (admin)' })
  remove(@Param('id') id: string) {
    return this.assignmentsService.remove(id);
  }
}
