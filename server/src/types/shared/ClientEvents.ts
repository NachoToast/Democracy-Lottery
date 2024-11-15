import { Emote } from './Emote.js';

/** Events that all users can emit. */
export const enum User {
    AttemptJoin = 'user:attempt-join',

    Emote = 'user:emote',
}

/** Events that only admins can emit. */
export const enum Admin {
    SetLockedDown = 'admin:set-locked-down',

    SetUserWeight = 'admin:set-user-weight',

    BanUser = 'admin:ban-user',

    KickUser = 'admin:kick-user',
}

export interface All {
    [User.AttemptJoin]: (name: string, password?: string) => void;

    [User.Emote]: (emote: Emote) => void;

    [Admin.SetLockedDown]: (isLockedDown: boolean) => void;

    [Admin.SetUserWeight]: (name: string, weight: number) => void;

    [Admin.BanUser]: (name: string) => void;

    [Admin.KickUser]: (name: string) => void;
}
