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
import { ApiOperation, ApiParam, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { GroupsService } from './groups.service';
import { BalancesService } from './balances.service';
import { ExpensesService } from '../expenses/expenses.service';
import { FxService } from '../fx/fx.service';
import { getUserFromRequest } from '../auth/jwt.util';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateGroupDto } from './dto/create-group.dto';

function requireAuth(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) {
    throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
  }
  return user;
}

@ApiTags('groups')
@ApiSecurity('access-token')
@Controller('api/groups')
export class GroupsController {
  constructor(
    private readonly groups: GroupsService,
    private readonly expenses: ExpensesService,
    private readonly balances: BalancesService,
    private readonly fx: FxService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List groups (summary for current user)' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async list(@Req() req: Request) {
    const user = requireAuth(req);
    const groups = await this.groups.listForUser(user.username);

    const enriched = await Promise.all(
      groups.map(async (g) => {
        const exps = await this.expenses.list(String(g._id));
        const converted = await this.fx.convertMany(
          exps.map((e: any) => ({
            amount: Number(e.amount) || 0,
            currency: e.currency || g.currency,
          })),
          g.currency,
        );
        const expsConverted = exps.map((e: any, i: number) => ({
          ...e,
          amount: converted[i],
        }));
        const bals = this.balances.computeBalances(g.members, expsConverted as any);
        const me = g.members.find((m) => m.name === user.username);
        const myBalance = me ? bals.find((b) => b.memberId === me.memberId)?.balance ?? 0 : 0;
        const total = converted.reduce((s, n) => s + n, 0);
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
  @ApiOperation({ summary: 'Create group' })
  async create(@Req() req: Request, @Body() body: CreateGroupDto) {
    const user = requireAuth(req);
    return this.groups.create(user.username, body?.name, body?.currency);
  }

  @Post('join/:token')
  @ApiOperation({ summary: 'Join group by invite token' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  @ApiResponse({ status: 404, description: 'Invalid invitation' })
  async join(@Req() req: Request, @Param('token') token: string) {
    const user = requireAuth(req);
    const group = await this.groups.joinByToken(token, user.username);
    if (!group) {
      throw new HttpException('Invalid invitation', HttpStatus.NOT_FOUND);
    }
    return { ok: true, groupId: group._id };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Group detail (members, expenses, balances, FX)' })
  @ApiParam({ name: 'id', description: 'Group id' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async detail(@Req() req: Request, @Param('id') id: string) {
    requireAuth(req);
    const group = await this.groups.findById(id);
    if (!group) throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
    const expenses = await this.expenses.list(id);

    const converted = await this.fx.convertMany(
      expenses.map((e: any) => ({
        amount: Number(e.amount) || 0,
        currency: e.currency || group.currency,
      })),
      group.currency,
    );

    const expensesEnriched = expenses.map((e: any, i: number) => ({
      ...e,
      currency: e.currency || group.currency,
      convertedAmount: Math.round(converted[i] * 100) / 100,
    }));

    const expensesForBalances = expenses.map((e: any, i: number) => ({
      ...e,
      amount: converted[i],
    }));

    const balances = this.balances.computeBalances(group.members, expensesForBalances as any);
    const settlements = this.balances.computeSettlements(balances);
    const total = converted.reduce((s, n) => s + n, 0);
    const fxInfo = await this.fx.getRates();
    return {
      group,
      expenses: expensesEnriched,
      balances,
      settlements,
      total,
      fx: { source: fxInfo.source, fetchedAt: fxInfo.fetchedAt, base: fxInfo.base },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete group' })
  @ApiParam({ name: 'id' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    requireAuth(req);
    return this.groups.delete(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member' })
  @ApiParam({ name: 'id' })
  async addMember(@Req() req: Request, @Param('id') id: string, @Body() body: AddMemberDto) {
    requireAuth(req);
    if (!body?.name?.trim()) {
      throw new HttpException('Name is required', HttpStatus.BAD_REQUEST);
    }
    return this.groups.addMember(id, body.name);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove member (fails if they appear in expenses)' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'memberId' })
  async removeMember(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    requireAuth(req);
    const group = await this.groups.findById(id);
    if (!group) throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
    const member = group.members.find((m) => m.memberId === memberId);
    if (!member) throw new HttpException('Member not found', HttpStatus.NOT_FOUND);
    if (group.members.length <= 1) {
      throw new HttpException(
        "Can't remove the last member of the group",
        HttpStatus.BAD_REQUEST,
      );
    }
    const expenses = await this.expenses.list(id);
    const hasExpenses = expenses.some(
      (e: any) => e.paidBy === memberId || e.splitBetween?.includes(memberId),
    );
    if (hasExpenses) {
      throw new HttpException(
        `Can't remove ${member.name}: they have associated expenses. Delete those expenses first.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.groups.removeMember(id, memberId);
  }

  @Get(':id/expenses')
  @ApiOperation({ summary: 'List expenses in group' })
  @ApiParam({ name: 'id' })
  async listExpenses(@Req() req: Request, @Param('id') id: string) {
    requireAuth(req);
    return this.expenses.list(id);
  }

  @Post(':id/expenses')
  @ApiOperation({ summary: 'Add expense' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 400, description: 'Validation or business rule error' })
  async createExpense(@Req() req: Request, @Param('id') id: string, @Body() body: CreateExpenseDto) {
    requireAuth(req);
    const group = await this.groups.findById(id);
    if (!group) throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
    const data: any = { ...body };
    if (!data?.splitBetween?.length) {
      data.splitBetween = group.members.map((m) => m.memberId);
    }
    const validIds = new Set(group.members.map((m) => m.memberId));
    if (!validIds.has(String(data.paidBy))) {
      throw new HttpException('Invalid payer', HttpStatus.BAD_REQUEST);
    }
    data.splitBetween = data.splitBetween.map(String).filter((memberId: string) =>
      validIds.has(memberId),
    );
    if (!data.splitBetween.length) {
      throw new HttpException('Select at least one valid member', HttpStatus.BAD_REQUEST);
    }
    try {
      const created = await this.expenses.create(id, data, group.currency);
      return { ok: true, id: created._id };
    } catch (err: any) {
      throw new HttpException(err?.message || 'Error', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id/expenses/:expenseId')
  @ApiOperation({ summary: 'Delete expense' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'expenseId' })
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
