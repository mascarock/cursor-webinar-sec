import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { BalancesService } from './balances.service';
import { ExpensesService } from '../expenses/expenses.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, BalancesService, ExpensesService],
})
export class GroupsModule {}
