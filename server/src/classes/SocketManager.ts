import { createServer } from 'http';
import { Db } from 'mongodb';
import { Server, Socket } from 'socket.io';
import { EnvVars } from '../types/EnvVars.js';
import {
    ClientEvents,
    Emote,
    ServerEvents,
    User,
} from '../types/shared/index.js';
import { EmoteManager } from './EmoteManager.js';
import { RejectionError } from './RejectionError.js';
import { UserManager } from './UserManager.js';

type ClientSocket = Socket<ClientEvents.All, ServerEvents.All>;

export class SocketManager {
    private readonly io: Server<ClientEvents.All, ServerEvents.All>;

    private readonly userManager: UserManager;
    private readonly emoteManager: EmoteManager;

    private isLockedDown: boolean;

    public constructor(env: EnvVars, db: Db, onStart: () => void) {
        const server = createServer();

        this.io = new Server<ClientEvents.All, ServerEvents.All>(server, {
            cors: { origin: '*' },
        });

        this.userManager = new UserManager(db, env);
        this.emoteManager = new EmoteManager();

        this.isLockedDown = false;

        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });

        server.listen(env.PORT, onStart);
    }

    private handleConnection(socket: ClientSocket): void {
        /** Disconnect in 5 seconds if no join attempt sent. */
        let disconnectTimeout = setTimeout(() => socket.disconnect(), 5_000);

        socket.on(ClientEvents.User.AttemptJoin, async (name, password) => {
            clearTimeout(disconnectTimeout);

            try {
                const user = await this.userManager.tryAddUser(
                    socket,
                    this.isLockedDown,
                    name,
                    password,
                );

                // Listening

                socket.on('disconnect', () => {
                    this.handleDisconnection(socket, user);
                });

                socket.on(ClientEvents.User.Emote, (emote) => {
                    this.handleEmote(socket, user, emote);
                });

                if (user.isAdmin) {
                    socket.on(
                        ClientEvents.Admin.SetLockedDown,
                        (isLockedDown) => {
                            this.handleSetLockedDown(
                                socket,
                                user,
                                isLockedDown,
                            );
                        },
                    );

                    socket.on(
                        ClientEvents.Admin.SetUserWeight,
                        (name, weight) => {
                            this.handleSetUserWeight(
                                socket,
                                user,
                                name,
                                weight,
                            );
                        },
                    );

                    socket.on(ClientEvents.Admin.BanUser, (name) => {
                        this.handleBanUser(socket, user, name);
                    });

                    socket.on(ClientEvents.Admin.KickUser, (name) => {
                        this.handleKickUser(socket, user, name);
                    });
                }

                // Emitting

                socket.broadcast.emit(
                    ServerEvents.User.Joined,
                    UserManager.withoutSocket(user),
                );

                let usersToShow: User[];
                let lockDownToShow;

                if (user.isAdmin) {
                    usersToShow = this.userManager.listUsers();
                    lockDownToShow = this.isLockedDown;
                } else {
                    usersToShow = [];
                    lockDownToShow = false;
                }

                socket.emit(
                    ServerEvents.User.Accepted,
                    UserManager.withoutSocket(user),
                    usersToShow,
                    lockDownToShow,
                );
            } catch (error) {
                if (error instanceof RejectionError) {
                    socket.emit(ServerEvents.User.Rejected, error.reason);

                    if (error.immediateDisconnect) {
                        socket.disconnect();
                    } else {
                        disconnectTimeout = setTimeout(() => {
                            socket.disconnect();
                        }, 5_000);
                    }
                } else {
                    socket.disconnect();
                    throw error;
                }
            }
        });
    }

    private handleDisconnection(socket: ClientSocket, user: User): void {
        socket.removeAllListeners();

        this.io.emit(ServerEvents.User.Left, user.name);

        this.userManager.removeUser(user.name);
        this.emoteManager.removeUser(user.name);

        if (user.isAdmin && !this.userManager.anyAdmins()) {
            this.io.disconnectSockets();
        }
    }

    private handleEmote(socket: ClientSocket, user: User, emote: Emote): void {
        if (!this.emoteManager.canEmote(user.name)) {
            return;
        }

        socket.broadcast.emit(ServerEvents.User.Emoted, user.name, emote);

        this.emoteManager.recordEmote(user.name);
    }

    private handleSetLockedDown(
        socket: ClientSocket,
        doneBy: User,
        isLockedDown: boolean,
    ): void {
        if (this.isLockedDown === isLockedDown) {
            return;
        }

        this.isLockedDown = isLockedDown;

        socket.broadcast.emit(
            ServerEvents.Admin.LockedDownChanged,
            isLockedDown,
            doneBy.name,
        );
    }

    private handleSetUserWeight(
        socket: ClientSocket,
        doneBy: User,
        name: string,
        weight: number,
    ): void {
        const user = this.userManager.getUserByName(name);

        if (user === undefined) {
            return;
        }

        if (user.weight === weight) {
            return;
        }

        user.weight = weight;

        this.userManager.updateUserWeight(user);

        socket.broadcast.emit(
            ServerEvents.Admin.UserWeightChanged,
            name,
            weight,
            doneBy.name,
        );
    }

    private handleBanUser(
        socket: ClientSocket,
        doneBy: User,
        name: string,
    ): void {
        const user = this.userManager.getUserByName(name);

        if (user === undefined) {
            return;
        }

        this.userManager.addBannedIp(user.socket.handshake.address);

        const allUsers = this.userManager.getUsersByIp(
            user.socket.handshake.address,
        );

        for (const user of allUsers) {
            if (!user.isAdmin) {
                user.socket.disconnect();
            }
        }

        socket.broadcast.emit(ServerEvents.Admin.UserBanned, name, doneBy.name);
    }

    private handleKickUser(
        socket: ClientSocket,
        doneBy: User,
        name: string,
    ): void {
        const user = this.userManager.getUserByName(name);

        if (user === undefined) {
            return;
        }

        user.socket.disconnect();

        socket.broadcast.emit(ServerEvents.Admin.UserKicked, name, doneBy.name);
    }
}
