import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentsDto } from './dto/create-assignments.dto';

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
