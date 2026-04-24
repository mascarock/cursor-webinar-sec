import { Inject, Injectable } from '@nestjs/common';
import { Db, ObjectId } from 'mongodb';
import { DB_TOKEN } from '../db/db.module';

export interface Member {
  memberId: string;
  name: string;
  isUser: boolean;
}

export interface Group {
  _id?: ObjectId;
  name: string;
  currency: string;
  ownerUsername: string;
  members: Member[];
  inviteToken: string;
  createdAt: Date;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

@Injectable()
export class GroupsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  private get col() {
    return this.db.collection<Group>('groups');
  }

  async create(ownerUsername: string, name: string, currency: string) {
    const ownerMember: Member = {
      memberId: genId(),
      name: ownerUsername,
      isUser: true,
    };
    const group: Group = {
      name: name?.trim() || 'Sin nombre',
      currency: currency || 'COP',
      ownerUsername,
      members: [ownerMember],
      inviteToken: genId() + genId(),
      createdAt: new Date(),
    };
    const result = await this.col.insertOne(group);
    return { ...group, _id: result.insertedId };
  }

  async listForUser(username: string) {
    return this.col
      .find({ 'members.name': username })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async findById(id: string) {
    return this.col.findOne({ _id: new ObjectId(id) });
  }

  async findByInviteToken(token: string) {
    return this.col.findOne({ inviteToken: token });
  }

  async joinByToken(token: string, username: string) {
    const group = await this.findByInviteToken(token);
    if (!group) return null;
    const already = group.members.some((m) => m.isUser && m.name === username);
    if (already) return group;
    const member: Member = { memberId: genId(), name: username, isUser: true };
    await this.col.updateOne(
      { _id: group._id },
      { $push: { members: member } },
    );
    return { ...group, members: [...group.members, member] };
  }

  async addMember(groupId: string, name: string) {
    const member: Member = {
      memberId: genId(),
      name: name?.trim(),
      isUser: false,
    };
    await this.col.updateOne(
      { _id: new ObjectId(groupId) },
      { $push: { members: member } },
    );
    return member;
  }

  async removeMember(groupId: string, memberId: string) {
    await this.col.updateOne(
      { _id: new ObjectId(groupId) },
      { $pull: { members: { memberId } } },
    );
    return { ok: true };
  }

  async delete(groupId: string) {
    await this.col.deleteOne({ _id: new ObjectId(groupId) });
    await this.db.collection('expenses').deleteMany({ groupId });
    return { ok: true };
  }
}
