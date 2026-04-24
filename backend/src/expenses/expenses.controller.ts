import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ExpensesService } from './expenses.service';
import { getUserFromRequest } from '../auth/jwt.util';

@Controller('api/expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  async list(@Req() req: Request) {
    const user = getUserFromRequest(req);
    if (!user) {
      throw new HttpException('No autenticado', HttpStatus.UNAUTHORIZED);
    }
    return this.expenses.list(user.username);
  }

  @Post()
  async create(@Req() req: Request, @Body() body: any) {
    const user = getUserFromRequest(req);
    if (!user) {
      throw new HttpException('No autenticado', HttpStatus.UNAUTHORIZED);
    }
    const created = await this.expenses.create(user.username, body);
    return { ok: true, id: created._id };
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = getUserFromRequest(req);
    if (!user) {
      throw new HttpException('No autenticado', HttpStatus.UNAUTHORIZED);
    }
    return this.expenses.findOne(id);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = getUserFromRequest(req);
    if (!user) {
      throw new HttpException('No autenticado', HttpStatus.UNAUTHORIZED);
    }
    await this.expenses.delete(id);
    return { ok: true };
  }
}
