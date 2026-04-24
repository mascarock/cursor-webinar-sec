import { Inject, Injectable } from '@nestjs/common';
import { Db, ObjectId } from 'mongodb';
import { DB_TOKEN } from '../db/db.module';

@Injectable()
export class ExpensesService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  list(username: string) {
    return this.db
      .collection('expenses')
      .find({ username })
      .sort({ date: -1 })
      .toArray();
  }

  async create(username: string, data: any) {
    const expense = {
      username,
      description: data?.description || '',
      amount: Number(data?.amount) || 0,
      category: data?.category || 'Otros',
      date: new Date(),
    };
    const result = await this.db.collection('expenses').insertOne(expense);
    return { ...expense, _id: result.insertedId };
  }

  findOne(id: string) {
    return this.db.collection('expenses').findOne({ _id: new ObjectId(id) });
  }

  delete(id: string) {
    return this.db
      .collection('expenses')
      .deleteOne({ _id: new ObjectId(id) });
  }
}
