import { Db, MongoClient, MongoClientOptions, ServerApiVersion } from 'mongodb';
import { UserModel } from '../models/UserModel.js';

export async function connectToMongoDb(
    uri: string,
    dbName: string,
): Promise<Db> {
    const options: MongoClientOptions = {
        serverApi: {
            version: ServerApiVersion.v1,
            deprecationErrors: true,
        },
    };

    const client = await new MongoClient(uri, options).connect();

    const db = client.db(dbName);

    await UserModel.createIndexes(db);

    return db;
}
