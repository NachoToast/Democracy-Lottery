import { decideDisplayPercentage } from './math';
import { socket } from './socket';
import { ServerEvents } from './types/shared';
import { getOrThrow } from './util';

const nameElement = getOrThrow('span#welcome-display');
const countElement = getOrThrow('span#user-count-display');
const chanceElement = getOrThrow('span#user-chance-display');

socket.on(ServerEvents.User.Accepted, (user) => {
    if (user.isAdmin) {
        return;
    }

    nameElement.textContent = user.name;
});

socket.on(ServerEvents.User.Info, (userCount, myWeight, totalWeight) => {
    countElement.textContent = (userCount - 1).toLocaleString();

    chanceElement.textContent = decideDisplayPercentage(
        (myWeight / totalWeight) * 100,
    );
});
