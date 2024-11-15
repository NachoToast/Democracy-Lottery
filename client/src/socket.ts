import { io, Socket } from 'socket.io-client';
import { ClientEvents, ServerEvents } from './types/shared';

function chooseEndpoint(): string {
    if (location.hostname === 'localhost') {
        return 'localhost:5000';
    }

    return 'dl.nachotoast.com';
}

export const socket: Socket<ServerEvents.All, ClientEvents.All> = io(
    `ws://${chooseEndpoint()}`,
    { autoConnect: false },
);

socket.onAny((eventName: string, ...args: unknown[]) => {
    console.log(`%c${eventName}`, 'color: gray', ...args);
});

socket.on('connect', () => {
    console.log('Connected!');
});

socket.on('disconnect', (reason, description) => {
    console.log('Disconnected!', reason, description);
});

socket.on('connect_error', (error) => {
    console.log('Connection error:', error);
});

(window as unknown as { socket: Socket }).socket = socket;
