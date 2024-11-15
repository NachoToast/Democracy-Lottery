import { Collection, Db } from 'mongodb';

interface BannedIpList {
    bannedIps: string[];
}

export class BanModel {
    private readonly collection: Collection<BannedIpList>;

    private data: Set<string>;

    public constructor(db: Db) {
        this.collection = db.collection('bannedIps');

        this.data = new Set();

        this.collection
            .findOne()
            .then((res) => {
                this.data = new Set(res?.bannedIps);
            })
            .catch((error: unknown) => {
                console.log(`Failed to fetch banned IPs`, error);
            });
    }

    public isBanned(ip: string): boolean {
        return this.data.has(ip);
    }

    public addIp(ip: string): void {
        if (this.data.has(ip)) {
            // Already banned.
            return;
        }

        this.collection
            .findOneAndUpdate(
                {},
                {
                    $addToSet: { bannedIps: ip },
                },
                { upsert: true, returnDocument: 'after' },
            )
            .then((res) => {
                if (res) {
                    this.data = new Set(res.bannedIps);
                } else {
                    console.log(`Updating banned IPs returned null`);

                    // Won't persist, but better than nothing.
                    this.data.add(ip);
                }
            })
            .catch((error: unknown) => {
                console.log(`Failed to add banned IP`, error);
            });
    }
}
