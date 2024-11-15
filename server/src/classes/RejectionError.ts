import { UserRejectionReason } from '../types/shared/UserDisconnectReason.js';

export class RejectionError extends Error {
    public readonly reason: UserRejectionReason;

    public readonly immediateDisconnect: boolean;

    public constructor(
        reason: UserRejectionReason,
        immediateDisconnect = false,
    ) {
        super();
        this.reason = reason;
        this.immediateDisconnect = immediateDisconnect;
    }
}
