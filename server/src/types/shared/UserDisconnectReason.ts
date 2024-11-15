export const enum UserRejectionReason {
    MissingPassword,

    InvalidPassword,

    Banned,

    ReachedConcurrencyLimit,

    NoAdmins,

    LockedDown,

    UsernameTaken,

    SocketIdTaken,
}
