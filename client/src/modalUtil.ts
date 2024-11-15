import { relativeTime } from './relativeTime';
import { User } from './types/shared';
import { getOrThrow } from './util';

const modalElement = getOrThrow('div#modal');
let latestAnchorEl: HTMLElement | null = null;
let curInterval: number | null = null;

modalElement.onpointerdown = (e): void => {
    e.stopPropagation();
};

window.addEventListener('pointerdown', (e) => {
    if (latestAnchorEl === null) {
        return;
    }

    if (e.target === latestAnchorEl) {
        return;
    }

    modalElement.classList.remove('active');
    latestAnchorEl.classList.remove('modal-target');
    latestAnchorEl = null;

    if (curInterval !== null) {
        clearInterval(curInterval);
    }
});

export function showModal(anchorEl: HTMLElement): void {
    if (latestAnchorEl !== null) {
        latestAnchorEl.classList.remove('modal-target');
    }

    if (curInterval !== null) {
        clearInterval(curInterval);
    }

    latestAnchorEl = anchorEl;

    anchorEl.classList.add('modal-target');

    const { x, y, height } = anchorEl.getBoundingClientRect();

    modalElement.style.left = `${(x - 1).toString()}px`;
    modalElement.style.top = `${(y + height).toString()}px`;

    modalElement.classList.add('active');
}

function toUserInfo(anchorEl: HTMLElement, user: User): void {
    modalElement.innerHTML = '';

    const nameElement = document.createElement('h2');
    nameElement.textContent = user.name;

    modalElement.appendChild(nameElement);

    // First Seen

    const firstSeenElement = document.createElement('p');
    firstSeenElement.classList.add('prefix');
    firstSeenElement.textContent = 'First seen: ';

    const firstSeenDate = new Date(user.firstSeen);

    const firtSeenText = document.createElement('span');

    const setFirstSeenText = (): void => {
        firtSeenText.textContent = relativeTime(firstSeenDate);
    };

    setFirstSeenText();

    const firstSeenSuffix = document.createElement('span');
    firstSeenSuffix.textContent =
        ' (' + firstSeenDate.toLocaleDateString() + ')';

    firstSeenElement.appendChild(firtSeenText);
    firstSeenElement.appendChild(firstSeenSuffix);
    modalElement.appendChild(firstSeenElement);

    // Last Seen

    const lastSeenElement = document.createElement('p');
    lastSeenElement.classList.add('prefix');
    lastSeenElement.textContent = 'Last seen: ';

    const lastSeenDate = new Date(user.lastSeen);

    const lastSeenText = document.createElement('span');

    const setLastSeenText = (): void => {
        lastSeenText.textContent = relativeTime(lastSeenDate);
    };

    setLastSeenText();

    const lastSeenSuffix = document.createElement('span');
    lastSeenSuffix.textContent = ' (' + lastSeenDate.toLocaleDateString() + ')';

    lastSeenElement.appendChild(lastSeenText);
    lastSeenElement.appendChild(lastSeenSuffix);
    modalElement.appendChild(lastSeenElement);

    // Times Doubled

    const timesDoubledElement = document.createElement('p');
    timesDoubledElement.classList.add('prefix');
    timesDoubledElement.textContent = 'Times doubled: ';

    const timesDoubledText = document.createElement('span');
    timesDoubledText.textContent = user.timesDoubled.toLocaleString();
    timesDoubledElement.appendChild(timesDoubledText);

    modalElement.appendChild(timesDoubledElement);

    showModal(anchorEl);

    curInterval = setInterval(() => {
        setFirstSeenText();
        setLastSeenText();
    }, 1_000);
}

function toBanOptions(
    anchorEl: HTMLElement,
    user: User,
    onClick: () => void,
): void {
    modalElement.innerHTML = '';

    const nameElement = document.createElement('h2');
    nameElement.textContent = user.name;

    modalElement.appendChild(nameElement);

    const textElement = document.createElement('p');

    textElement.textContent = 'Will be IP banned.';

    modalElement.appendChild(textElement);

    const banButton = document.createElement('button');
    banButton.className = 'ip-ban-button';
    banButton.textContent = 'Ban';

    banButton.onclick = onClick;

    modalElement.appendChild(banButton);

    showModal(anchorEl);
}

export const setModalContext = { toUserInfo, toBanOptions };
