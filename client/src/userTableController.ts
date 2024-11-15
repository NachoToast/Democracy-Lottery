import { reverseEmoteMap } from './emoteController';
import { decideDisplayPercentage, gcf } from './math';
import { setModalContext } from './modalUtil';
import { socket } from './socket';
import { ClientEvents, ServerEvents, User } from './types/shared';
import { getOrThrow } from './util';

const countElement = getOrThrow('h2#user-count');
const tableElement = getOrThrow('tbody#user-table');
const copyButton = getOrThrow('button#copy-button');

const userList = new Map<
    string,
    {
        user: User;
        rowElement: HTMLTableRowElement;
        weightElement: HTMLInputElement;
        chanceElement: HTMLTableCellElement;
        emoteElement: HTMLSpanElement;
    }
>();

function getCumulativeWeights(): number {
    let totalWeight = 0;

    for (const { user } of userList.values()) {
        totalWeight += user.weight;
    }

    return totalWeight;
}

function recalculateAllChances(): void {
    const totalWeight = getCumulativeWeights();

    for (const { user, chanceElement } of userList.values()) {
        const chance = (user.weight / totalWeight) * 100;

        chanceElement.textContent = decideDisplayPercentage(chance);
    }
}

function updateReportedUserCount(): void {
    countElement.textContent = `In The Draw (${userList.size.toString()})`;
}

function makeNameElement(user: User): [HTMLTableCellElement, HTMLSpanElement] {
    const nameElement = document.createElement('div');
    nameElement.className = 'name-cell';

    nameElement.textContent = user.name;

    if (user.isAdmin) {
        nameElement.classList.add('admin', user.name.toLowerCase());

        nameElement.title = `This user is an admin and cannot be kicked or banned.`;
    }

    const emoteElement = document.createElement('span');
    emoteElement.className = 'emote';

    nameElement.appendChild(emoteElement);

    const containerElement = document.createElement('td');

    containerElement.appendChild(nameElement);

    return [containerElement, emoteElement];
}

function makeWeightElement(
    name: string,
    weight: number,
): [HTMLTableCellElement, HTMLInputElement] {
    const tdElement = document.createElement('td');
    const container = document.createElement('div');
    const weightElement = document.createElement('input');

    weightElement.value = weight.toString();
    weightElement.inputMode = 'numeric';
    weightElement.pattern = '\\d*';

    weightElement.oninput = (): void => {
        const newValue = Number(weightElement.value);

        if (
            !Number.isInteger(newValue) ||
            !Number.isFinite(newValue) ||
            newValue < 0
        ) {
            weightElement.classList.add('invalid');
        } else {
            weightElement.classList.remove('invalid');

            const user = userList.get(name);
            if (user !== undefined) {
                user.user.weight = newValue;
                recalculateAllChances();
            }

            socket.emit(ClientEvents.Admin.SetUserWeight, name, newValue);
        }
    };

    weightElement.onblur = (): void => {
        const currentValue = Number(weightElement.value);

        if (
            !Number.isInteger(currentValue) ||
            !Number.isFinite(currentValue) ||
            currentValue < 0
        ) {
            weightElement.classList.remove('invalid');

            weightElement.value =
                userList.get(name)?.user.weight.toString() ?? '??';
        }
    };

    container.append(weightElement);
    tdElement.append(container);

    return [tdElement, weightElement];
}

function makeChanceElement(weight: number): HTMLTableCellElement {
    const chanceElement = document.createElement('td');

    const totalWeight = getCumulativeWeights();
    const chance = (weight / (totalWeight + weight)) * 100;

    chanceElement.textContent = decideDisplayPercentage(chance);

    return chanceElement;
}

function makeActionElements(user: User): HTMLTableCellElement {
    const tdElement = document.createElement('td');
    const container = document.createElement('div');

    tdElement.append(container);

    // Info Button

    const infoButton = document.createElement('button');
    infoButton.classList.add('action-button', 'info');
    infoButton.textContent = 'Info';

    infoButton.onclick = (): void => {
        setModalContext.toUserInfo(infoButton, user);
    };

    container.append(infoButton);

    if (!user.isAdmin) {
        // Kick Button

        const kickButton = document.createElement('button');
        kickButton.classList.add('action-button', 'kick');
        kickButton.textContent = 'Kick';

        kickButton.onclick = (): void => {
            socket.emit(ClientEvents.Admin.KickUser, user.name);
        };

        // Ban Button

        const banButton = document.createElement('button');
        banButton.classList.add('action-button', 'ban');
        banButton.textContent = 'Ban';

        banButton.onclick = (): void => {
            setModalContext.toBanOptions(banButton, user, () => {
                socket.emit(ClientEvents.Admin.BanUser, user.name);
            });
        };

        container.append(kickButton, banButton);
    }

    return tdElement;
}

function handleJoin(user: User): void {
    const rowElement = document.createElement('tr');

    const [nameElement, emoteElement] = makeNameElement(user);

    const [weightElementCell, weightElement] = makeWeightElement(
        user.name,
        user.weight,
    );

    const chanceElement = makeChanceElement(user.weight);

    const actionElements = makeActionElements(user);

    rowElement.append(
        nameElement,
        weightElementCell,
        chanceElement,
        actionElements,
    );

    userList.set(user.name, {
        user,
        rowElement,
        weightElement,
        chanceElement,
        emoteElement,
    });

    tableElement.append(rowElement);

    updateReportedUserCount();

    recalculateAllChances();
}

function exportToClipboard(): void {
    const values = Array.from(userList.values()).map(
        (e) => [e.user.name, e.user.weight] as const,
    );

    const factor = gcf(...values.map((e) => e[1]));

    const output = values
        .flatMap((e) => new Array<string>(e[1] / factor).fill(e[0]))
        .join('\n');

    navigator.clipboard
        .writeText(output)
        .then(() => {
            window.alert('Copied to clipboard!');
        })
        .catch(() => {
            window.alert('Failed to copy to clipboard!');
        });
}

copyButton.onclick = exportToClipboard;

socket.on(ServerEvents.User.Joined, handleJoin);

socket.on(ServerEvents.User.Accepted, (user, users) => {
    if (!user.isAdmin) {
        return;
    }

    for (const user of users) {
        handleJoin(user);
    }

    recalculateAllChances();
});

socket.on(ServerEvents.User.Left, (name) => {
    const user = userList.get(name);

    if (user === undefined) {
        return;
    }

    user.rowElement.remove();

    userList.delete(name);

    updateReportedUserCount();

    recalculateAllChances();
});

socket.on(ServerEvents.Admin.UserWeightChanged, (name, weight) => {
    const user = userList.get(name);

    if (user === undefined) {
        return;
    }

    user.user.weight = weight;
    user.weightElement.value = weight.toString();

    recalculateAllChances();
});

socket.on(ServerEvents.User.Emoted, (name, emote) => {
    const user = userList.get(name);

    if (user === undefined) {
        return;
    }

    user.emoteElement.style.backgroundImage = `url('/assets/emojis/${reverseEmoteMap[emote]}.svg')`;

    user.emoteElement.style.animationName = 'pop';
    user.emoteElement.classList.add('visible');

    setTimeout(() => {
        user.emoteElement.style.animationName = '';
    }, 1_000);
});
