import { Injectable } from '@nestjs/common';
import { Member } from './groups.service';

export interface Expense {
  paidBy: string;
  amount: number;
  splitBetween: string[];
}

export interface Balance {
  memberId: string;
  name: string;
  balance: number;
}

export interface Settlement {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

@Injectable()
export class BalancesService {
  computeBalances(members: Member[], expenses: Expense[]): Balance[] {
    const map: Record<string, number> = {};
    members.forEach((m) => (map[m.memberId] = 0));

    for (const e of expenses) {
      const amt = Number(e.amount) || 0;
      const split = e.splitBetween?.length ? e.splitBetween : members.map((m) => m.memberId);
      const share = amt / split.length;
      if (map[e.paidBy] !== undefined) map[e.paidBy] += amt;
      for (const id of split) {
        if (map[id] !== undefined) map[id] -= share;
      }
    }

    return members.map((m) => ({
      memberId: m.memberId,
      name: m.name,
      balance: Math.round(map[m.memberId] * 100) / 100,
    }));
  }

  /**
   * Greedy minimum-transfers: pair largest creditor with largest debtor.
   */
  computeSettlements(balances: Balance[]): Settlement[] {
    const EPSILON = 0.01;
    const creditors = balances
      .filter((b) => b.balance > EPSILON)
      .map((b) => ({ ...b }))
      .sort((a, b) => b.balance - a.balance);
    const debtors = balances
      .filter((b) => b.balance < -EPSILON)
      .map((b) => ({ ...b, balance: -b.balance }))
      .sort((a, b) => b.balance - a.balance);

    const settlements: Settlement[] = [];

    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.balance, creditor.balance);
      const rounded = Math.round(amount * 100) / 100;

      if (rounded > 0) {
        settlements.push({
          fromId: debtor.memberId,
          fromName: debtor.name,
          toId: creditor.memberId,
          toName: creditor.name,
          amount: rounded,
        });
      }

      debtor.balance -= amount;
      creditor.balance -= amount;
      if (debtor.balance < EPSILON) i++;
      if (creditor.balance < EPSILON) j++;
    }

    return settlements;
  }
}
