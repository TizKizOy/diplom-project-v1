import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminLogService } from './admin-log.service';
import { IAdminLog } from './interface/admin-log.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Admin-Log')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin-log')
export class AdminLogController {
  constructor(private readonly adminLogService: AdminLogService) {}

  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Получить всех активных пользователей' })
  async getAll(): Promise<IAdminLog[]> {
    return this.adminLogService.getAll();
  }
}
