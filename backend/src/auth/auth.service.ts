import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { DB_TOKEN } from '../db/db.module';

@Injectable()
export class AuthService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async register(username: any, password: any) {
    const existing = await this.db.collection('users').findOne({ username });
    if (existing) return null;
    const result = await this.db.collection('users').insertOne({
      username,
      password,
      createdAt: new Date(),
    });
    return { _id: result.insertedId, username };
  }

  async login(username: any, password: any) {
    const user = await this.db.collection('users').findOne({
      username: username,
      password: password,
    });
    return user;
  }
}
