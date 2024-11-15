import { Collection, Db, WithId } from 'mongodb';
import { User } from '../types/shared/index.js';

type StoredUser = WithId<Omit<User, 'isAdmin'>>;

const twentyFourHours = 24 * 60 * 60 * 1000;

export class UserModel {
    private readonly collection: Collection<StoredUser>;

    public constructor(db: Db) {
        this.collection = db.collection('users');
    }

    public static async createIndexes(db: Db): Promise<void> {
        await db
            .collection<StoredUser>('users')
            .createIndexes([{ key: { name: 1 } }]);
    }

    public async upsertUser(user: User): Promise<void> {
        const now = Date.now();

        const existingUser = await this.collection.findOne({ name: user.name });

        if (existingUser !== null) {
            user.weight = existingUser.weight;
            user.firstSeen = existingUser.firstSeen;

            if (now > existingUser.lastSeen + twentyFourHours) {
                console.log(
                    `Doubling weight of ${
                        user.name
                    } (was ${user.weight.toString()}) since last seen > 24 hours ago`,
                );

                user.weight *= 2;
                user.timesDoubled++;
            }
        }

        this.collection
            .updateOne(
                { name: user.name },
                {
                    $set: {
                        lastSeen: now,
                        weight: user.weight,
                        timesDoubled: user.timesDoubled,
                    },
                    $setOnInsert: {
                        name: user.name,
                        firstSeen: now,
                    },
                },
                { upsert: true },
            )
            .catch((error: unknown) => {
                console.log(`Failed to upsert ${user.name}`, error);
            });
    }

    public updateWeight(user: User): void {
        this.collection
            .updateOne({ name: user.name }, { $set: { weight: user.weight } })
            .catch((error: unknown) => {
                console.log(`Failed to update weight of ${user.name}`, error);
            });
    }

    public deleteUser(name: string): void {
        this.collection.deleteOne({ name }).catch((error: unknown) => {
            console.log(`Failed to delete ${name}`, error);
        });
    }
}
