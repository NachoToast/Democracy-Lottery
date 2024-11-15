import { Db } from 'mongodb';
import { Socket } from 'socket.io';
import { BanModel } from '../models/BanModel.js';
import { UserModel } from '../models/UserModel.js';
import { EnvVars } from '../types/EnvVars.js';
import {
    ClientEvents,
    ServerEvents,
    User,
    UserRejectionReason,
} from '../types/shared/index.js';
import { RejectionError } from './RejectionError.js';

interface UserWithSocket extends User {
    socket: Socket<ClientEvents.All, ServerEvents.All>;
}

/** Manages a list of connected users. */
export class UserManager {
    private static readonly MAX_CONNECTIONS_PER_IP = 5;

    private readonly userModel: UserModel;
    private readonly banModel: BanModel;

    private readonly adminPassword: string;

    private readonly usersByName: Map<string, UserWithSocket>;
    private readonly usersByIp: Map<string, UserWithSocket[]>;

    public constructor(db: Db, env: EnvVars) {
        this.userModel = new UserModel(db);
        this.banModel = new BanModel(db);

        this.adminPassword = env.ADMIN_PASSWORD;

        this.usersByName = new Map();
        this.usersByIp = new Map();
    }

    public static withoutSocket(user: UserWithSocket): User {
        const output: User & Pick<Partial<UserWithSocket>, 'socket'> = {
            ...user,
        };

        delete output.socket;

        return output;
    }

    public async tryAddUser(
        socket: Socket,
        isLockedDown: boolean,
        name: string,
        password?: string,
    ): Promise<UserWithSocket> {
        let isAdmin = false;

        const ip = socket.handshake.address;
        const concurrentUsers = this.usersByIp.get(ip);

        if (name === 'NachoToast' || name === 'Eravin') {
            // Admin Escalation

            if (password === undefined) {
                throw new RejectionError(UserRejectionReason.MissingPassword);
            }

            if (password !== this.adminPassword) {
                throw new RejectionError(UserRejectionReason.InvalidPassword);
            }

            isAdmin = true;
        } else {
            // Non-Admin Checks

            if (this.banModel.isBanned(ip)) {
                throw new RejectionError(UserRejectionReason.Banned, true);
            }

            const numConcurrent = concurrentUsers?.length ?? 0;

            if (numConcurrent > UserManager.MAX_CONNECTIONS_PER_IP) {
                throw new RejectionError(
                    UserRejectionReason.ReachedConcurrencyLimit,
                );
            }

            if (!this.anyAdmins()) {
                throw new RejectionError(UserRejectionReason.NoAdmins);
            }

            if (isLockedDown) {
                throw new RejectionError(UserRejectionReason.LockedDown);
            }
        }

        // Universal Checks

        if (this.usersByName.get(name) !== undefined) {
            throw new RejectionError(UserRejectionReason.UsernameTaken);
        }

        // User Creation

        const now = Date.now();

        const user: UserWithSocket = {
            socket,
            name,
            weight: 1,
            lastSeen: now,
            firstSeen: now,
            timesDoubled: 0,
            isAdmin,
        };

        this.usersByName.set(name, user);

        if (concurrentUsers !== undefined) {
            concurrentUsers.push(user);
        } else {
            this.usersByIp.set(ip, [user]);
        }

        await this.userModel.upsertUser(user);

        this.broadcastStats();

        return user;
    }

    public removeUser(name: string): void {
        const user = this.usersByName.get(name);

        if (user === undefined) {
            return;
        }

        this.usersByName.delete(name);

        this.broadcastStats();

        const concurrentUsers = this.usersByIp.get(
            user.socket.handshake.address,
        );

        if (concurrentUsers === undefined) {
            console.log(`Removed user ${name} has no recorded IP`);
            return;
        }

        const idx = concurrentUsers.findIndex((x) => x === user);

        if (idx === -1) {
            console.log(`Couldn't find ${name} in IP list`, concurrentUsers);
        } else {
            concurrentUsers.splice(idx, 1);
        }
    }

    public deleteUser(name: string): void {
        this.userModel.deleteUser(name);
    }

    public getUserByName(name: string): UserWithSocket | undefined {
        return this.usersByName.get(name) ?? undefined;
    }

    public getUsersByIp(ip: string): UserWithSocket[] {
        return this.usersByIp.get(ip) ?? [];
    }

    public listUsers(): User[] {
        return Array.from(this.usersByName.values()).map((x) => {
            return UserManager.withoutSocket(x);
        });
    }

    public updateUserWeight(user: UserWithSocket): void {
        this.userModel.updateWeight(user);

        this.broadcastStats();
    }

    public addBannedIp(ip: string): void {
        this.banModel.addIp(ip);
    }

    public anyAdmins(): boolean {
        for (const user of this.usersByName.values()) {
            if (user.isAdmin) {
                return true;
            }
        }

        return false;
    }

    private broadcastStats(): void {
        const users = this.listUsers();

        let totalWeight = 0;

        for (const user of users) {
            totalWeight += user.weight;
        }

        for (const user of this.usersByName.values()) {
            if (user.isAdmin) {
                continue;
            }

            user.socket.emit(
                ServerEvents.User.Info,
                users.length,
                user.weight,
                totalWeight,
            );
        }
    }
}
