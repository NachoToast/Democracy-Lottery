import { autologinEnabled } from './autoLoginController';
import { setActiveView } from './pageController';
import { socket } from './socket';
import {
    ClientEvents,
    ServerEvents,
    UserRejectionReason,
} from './types/shared';
import { getOrThrow } from './util';

const formElement = getOrThrow('form#login-form');
const usernameElement = getOrThrow('input#username-input');
const passwordSection = getOrThrow('div#password-section');
const passwordElement = getOrThrow('input#password-input');
const submitButton = getOrThrow('button#submit-login-button');

const key = 'democracy-lottery-username';

let username = localStorage.getItem(key) ?? usernameElement.value;
let password = passwordElement.value;
let alwaysDisabled = false;

usernameElement.value = username;
handleUpdate();

function handleUpdate(textContent?: string): void {
    if (username) {
        localStorage.setItem(key, username);
    } else {
        localStorage.removeItem(key);
    }

    if (username === 'NachoToast' || username === 'Eravin') {
        passwordSection.classList.add('visible');
        passwordElement.required = true;
        submitButton.disabled = !password;
    } else {
        passwordSection.classList.remove('visible');
        passwordElement.required = false;
        submitButton.disabled = !username;
    }

    if (alwaysDisabled) {
        submitButton.disabled = true;
    } else {
        submitButton.textContent = textContent ?? 'Join';
    }
}

function handleNormalDisconnect(): void {
    handleUpdate();
}

function submit(): void {
    const previousText = formElement.querySelectorAll(
        'p.rejection-helper-text',
    );

    previousText.forEach((element) => {
        element.remove();
    });

    if (socket.connected) {
        submitButton.textContent = 'Retrying...';
    } else {
        submitButton.textContent = 'Joining...';
        socket.connect();
    }

    socket.on('disconnect', handleNormalDisconnect);

    socket.emit(ClientEvents.User.AttemptJoin, username, password);
}

formElement.onsubmit = (e): void => {
    e.preventDefault();
    submit();
};

usernameElement.oninput = (): void => {
    username = usernameElement.value;
    handleUpdate();
};

passwordElement.oninput = (): void => {
    password = passwordElement.value;
    handleUpdate();
};

socket.on(ServerEvents.User.Rejected, (reason) => {
    socket.off('disconnect', handleNormalDisconnect);

    let text: string;
    let severity: 'error' | 'info' = 'error';
    let allowRejoins = true;

    switch (reason) {
        case UserRejectionReason.MissingPassword:
            text = 'Please provide a password';
            break;
        case UserRejectionReason.InvalidPassword:
            text = 'Incorrect password';
            break;
        case UserRejectionReason.Banned:
            text = 'You are banned :/';
            allowRejoins = false;
            break;
        case UserRejectionReason.ReachedConcurrencyLimit:
            text = 'Too many connections from your IP';
            allowRejoins = false;
            break;
        case UserRejectionReason.NoAdmins:
            text =
                'You are too eager Helldiver! Please wait for Eravin to set things up.';
            severity = 'info';
            break;
        case UserRejectionReason.LockedDown:
            text =
                'You missed your chance Helldiver! The lottery is currently not accepting new entries.';
            break;
        case UserRejectionReason.UsernameTaken:
            text = 'Username already taken';
            break;
        case UserRejectionReason.SocketIdTaken:
        default:
            text =
                'Something seriously wrong has occurred, Helldiver. Super Earth demands you to report this to NachoToast!';
            break;
    }

    const p = document.createElement('p');
    p.classList.add('rejection-helper-text', severity);

    p.textContent = text;

    formElement.append(p);

    alwaysDisabled = true;

    submitButton.disabled = true;

    if (!allowRejoins) {
        submitButton.style.display = 'none';
        return;
    }

    let canRetryInSeconds = 3;

    const showCanRetryIn = (): void => {
        submitButton.textContent = `Retry in ${(--canRetryInSeconds).toString()}...`;
    };

    showCanRetryIn();

    const interval = setInterval(() => {
        showCanRetryIn();
    }, 1_000);

    setTimeout(() => {
        clearInterval(interval);
        alwaysDisabled = false;
        handleUpdate('Retry');
    }, canRetryInSeconds * 1_000 - 1);
});

if (autologinEnabled && !submitButton.disabled) {
    if (username === 'NachoToast' || username === 'Eravin') {
        setActiveView('admin-view');
    } else {
        // TODO: setActiveView('user-view');
    }

    submit();
} else {
    setActiveView('login-view');
}
