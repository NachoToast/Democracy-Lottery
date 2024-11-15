import { Emote } from './Emote.js';
import { User as SiteUser } from './User.js';
import { UserRejectionReason } from './UserDisconnectReason.js';

/** Events that are about all users. */
export const enum User {
    Joined = 'user:joined',

    Left = 'user:left',

    Emoted = 'user:emoted',

    Accepted = 'user:accepted',

    Rejected = 'user:rejected',

    Info = 'user:info',
}

/** Events that are about administration. */
export const enum Admin {
    LockedDownChanged = 'admin:locked-down-changed',

    UserWeightChanged = 'admin:user-weight-changed',

    UserBanned = 'admin:user-banned',

    UserKicked = 'admin:user-kicked',
}

export interface All {
    [User.Joined]: (user: SiteUser) => void;

    [User.Left]: (name: string) => void;

    [User.Emoted]: (name: string, emote: Emote) => void;

    [User.Accepted]: (
        youAre: SiteUser,
        users: SiteUser[],
        isLockedDown: boolean,
    ) => void;

    [User.Rejected]: (reason: UserRejectionReason) => void;

    [User.Info]: (
        count: number,
        yourWeight: number,
        totalWeight: number,
    ) => void;

    [Admin.LockedDownChanged]: (isLockedDown: boolean, doneBy: string) => void;

    [Admin.UserWeightChanged]: (
        name: string,
        weight: number,
        doneBy: string,
    ) => void;

    [Admin.UserBanned]: (name: string, doneBy: string) => void;

    [Admin.UserKicked]: (name: string, doneBy: string) => void;
}
