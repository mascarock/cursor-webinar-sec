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
import { GroupsService } from './groups.service';
import { BalancesService } from './balances.service';
import { ExpensesService } from '../expenses/expenses.service';
import { getUserFromRequest } from '../auth/jwt.util';

function requireAuth(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) {
    throw new HttpException('No autenticado', HttpStatus.UNAUTHORIZED);
  }
  return user;
}

@Controller('api/groups')
export class GroupsController {
  constructor(
    private readonly groups: GroupsService,
    private readonly expenses: ExpensesService,
    private readonly balances: BalancesService,
  ) {}

  @Get()
  async list(@Req() req: Request) {
    const user = requireAuth(req);
    const groups = await this.groups.listForUser(user.username);

    const enriched = await Promise.all(
      groups.map(async (g) => {
        const exps = await this.expenses.list(String(g._id));
        const bals = this.balances.computeBalances(g.members, exps as any);
        const me = g.members.find((m) => m.name === user.username);
        const myBalance = me ? bals.find((b) => b.memberId === me.memberId)?.balance ?? 0 : 0;
        const total = exps.reduce((s, e: any) => s + (Number(e.amount) || 0), 0);
        return {
          _id: g._id,
          name: g.name,
          currency: g.currency,
          memberCount: g.members.length,
          expenseCount: exps.length,
          total,
          myBalance,
        };
      }),
    );
    return enriched;
  }

  @Post()
  async create(@Req() req: Request, @Body() body: { name: string; currency: string }) {
    const user = requireAuth(req);
    return this.groups.create(user.username, body?.name, body?.currency);
  }

  @Post('join/:token')
  async join(@Req() req: Request, @Param('token') token: string) {
    const user = requireAuth(req);
    const group = await this.groups.joinByToken(token, user.username);
    if (!group) {
      throw new HttpException('Invitación inválida', HttpStatus.NOT_FOUND);
    }
    return { ok: true, groupId: group._id };
  }

  @Get(':id')
  async detail(@Req() req: Request, @Param('id') id: string) {
    requireAuth(req);
    const group = await this.groups.findById(id);
    if (!group) throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
    const expenses = await this.expenses.list(id);
    const balances = this.balances.computeBalances(group.members, expenses as any);
    const settlements = this.balances.computeSettlements(balances);
    const total = expenses.reduce((s, e: any) => s + (Number(e.amount) || 0), 0);
    return { group, expenses, balances, settlements, total };
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    requireAuth(req);
    return this.groups.delete(id);
  }

  @Post(':id/members')
  async addMember(@Req() req: Request, @Param('id') id: string, @Body() body: { name: string }) {
    requireAuth(req);
    if (!body?.name?.trim()) {
      throw new HttpException('Nombre requerido', HttpStatus.BAD_REQUEST);
    }
    return this.groups.addMember(id, body.name);
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    requireAuth(req);
    const group = await this.groups.findById(id);
    if (!group) throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
    const member = group.members.find((m) => m.memberId === memberId);
    if (!member) throw new HttpException('Miembro no encontrado', HttpStatus.NOT_FOUND);
    if (group.members.length <= 1) {
      throw new HttpException(
        'No se puede quitar el último miembro del grupo',
        HttpStatus.BAD_REQUEST,
      );
    }
    const expenses = await this.expenses.list(id);
    const hasExpenses = expenses.some(
      (e: any) => e.paidBy === memberId || e.splitBetween?.includes(memberId),
    );
    if (hasExpenses) {
      throw new HttpException(
        `No se puede quitar a ${member.name}: tiene gastos asociados. Eliminá primero esos gastos.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.groups.removeMember(id, memberId);
  }

  @Get(':id/expenses')
  async listExpenses(@Req() req: Request, @Param('id') id: string) {
    requireAuth(req);
    return this.expenses.list(id);
  }

  @Post(':id/expenses')
  async createExpense(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    requireAuth(req);
    const group = await this.groups.findById(id);
    if (!group) throw new HttpException('Grupo no encontrado', HttpStatus.NOT_FOUND);
    if (!body?.splitBetween?.length) {
      body.splitBetween = group.members.map((m) => m.memberId);
    }
    const validIds = new Set(group.members.map((m) => m.memberId));
    if (!validIds.has(String(body.paidBy))) {
      throw new HttpException('Pagador inválido', HttpStatus.BAD_REQUEST);
    }
    body.splitBetween = body.splitBetween.map(String).filter((id: string) => validIds.has(id));
    if (!body.splitBetween.length) {
      throw new HttpException('Seleccioná al menos un miembro válido', HttpStatus.BAD_REQUEST);
    }
    try {
      const created = await this.expenses.create(id, body);
      return { ok: true, id: created._id };
    } catch (err: any) {
      throw new HttpException(err?.message || 'Error', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id/expenses/:expenseId')
  async deleteExpense(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('expenseId') expenseId: string,
  ) {
    requireAuth(req);
    await this.expenses.delete(expenseId);
    return { ok: true };
  }
}
