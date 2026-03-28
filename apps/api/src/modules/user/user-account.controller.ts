import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { Roles } from '../auth/roles.decorator';
import { UserAccountService } from './user-account.service';

import type { CreateUserDto, UpdateUserDto, UpdateUserRolesDto, UserListQuery } from './user-account.service';

@Roles('manager')
@Controller('users')
export class UserAccountController {
  constructor(
    private readonly userAccountService: UserAccountService,
  ) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.userAccountService.create(dto);
  }

  @Get()
  async findAll(@Query() query: UserListQuery) {
    return this.userAccountService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.userAccountService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userAccountService.update(id, dto);
  }

  @Put(':id/roles')
  async updateRoles(@Param('id') id: string, @Body() dto: UpdateUserRolesDto) {
    return this.userAccountService.updateRoles(id, dto);
  }
}
