import { socket } from './socket';
import { ClientEvents, Emote } from './types/shared';
import { getOrThrow } from './util';

const containerElement = getOrThrow('div#primary-emote-row');
const buttonElements = containerElement.querySelectorAll('button');

const emoteMap: Record<string, Emote> = {
    skull: Emote.Skull,
    sunglasses: Emote.Sunglasses,
    sob: Emote.Sob,
    flushed: Emote.Flushed,
    nerd: Emote.Nerd,
};

export const reverseEmoteMap = Object.fromEntries(
    Object.entries(emoteMap).map(([key, value]) => [value, key]),
) as Record<Emote, string>;

for (const button of buttonElements) {
    const emote = emoteMap[button.className];

    if (emote === undefined) {
        console.warn(`Unknown emote class: ${button.className}`);
        continue;
    }

    button.onclick = (): void => {
        socket.emit(ClientEvents.User.Emote, emote);

        containerElement.classList.add('disabled');

        setTimeout(() => {
            containerElement.classList.remove('disabled');
        }, 1_000);
    };
}
