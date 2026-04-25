import { Inject, Injectable } from '@nestjs/common';
import { Db, ObjectId } from 'mongodb';
import { DB_TOKEN } from '../db/db.module';

export interface Expense {
  _id?: ObjectId;
  groupId: string;
  paidBy: string;
  description: string;
  amount: number;
  category: string;
  splitBetween: string[];
  date: Date;
}

@Injectable()
export class ExpensesService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  private get col() {
    return this.db.collection<Expense>('expenses');
  }

  list(groupId: string) {
    return this.col.find({ groupId }).sort({ date: -1 }).toArray();
  }

  async create(groupId: string, data: any): Promise<Expense> {
    const amount = Number(data?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }
    const expense: Expense = {
      groupId,
      paidBy: String(data?.paidBy || ''),
      description: String(data?.description || '').trim(),
      amount,
      category: data?.category || 'Otros',
      splitBetween: Array.isArray(data?.splitBetween) ? data.splitBetween.map(String) : [],
      date: new Date(),
    };
    const result = await this.col.insertOne(expense);
    return { ...expense, _id: result.insertedId };
  }

  delete(expenseId: string) {
    return this.col.deleteOne({ _id: new ObjectId(expenseId) });
  }
}
