import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

export const DB_TOKEN = 'MONGO_DB';

const dbProvider = {
  provide: DB_TOKEN,
  useFactory: async (): Promise<Db> => {
    let uri = process.env.MONGODB_URI;
    let memServer: MongoMemoryServer | null = null;
    if (!uri) {
      memServer = await MongoMemoryServer.create();
      uri = memServer.getUri();
      console.log('Usando MongoDB en memoria:', uri);
    }
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('gastos_familiares');
    (db as any).__memServer = memServer;
    (db as any).__client = client;
    console.log('Conectado a MongoDB');
    return db;
  },
};

@Global()
@Module({
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DbModule implements OnModuleDestroy {
  async onModuleDestroy() {}
}
