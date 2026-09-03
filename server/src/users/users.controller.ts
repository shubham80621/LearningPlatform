import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateLearnerDto } from './dto/create-learner.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './schemas/user.schema';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('learners')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all learners (admin only)' })
  async listLearners() {
    const learners = await this.usersService.findLearners();
    return learners.map((learner) => this.usersService.toSafeUser(learner));
  }

  @Get('learners/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a learner by id (admin only)' })
  findLearner(@Param('id') id: string) {
    return this.usersService.findLearnerById(id);
  }

  @Post('learners')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a learner account (admin only)' })
  createLearner(@Body() dto: CreateLearnerDto) {
    return this.usersService.createLearner(dto);
  }
}
