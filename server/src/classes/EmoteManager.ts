import { User } from '../types/shared/User.js';

export class EmoteManager {
    private static readonly COOLDOWN_MS = 1_000;

    private readonly emoteTimes = new Map<User['name'], number>();

    public canEmote(name: string): boolean {
        const lastEmotedAt = this.emoteTimes.get(name);

        if (lastEmotedAt === undefined) {
            return true;
        }

        if (Date.now() < lastEmotedAt + EmoteManager.COOLDOWN_MS) {
            return false;
        }

        return true;
    }

    public recordEmote(name: string): void {
        this.emoteTimes.set(name, Date.now());
    }

    public removeUser(name: string): void {
        this.emoteTimes.delete(name);
    }
}
