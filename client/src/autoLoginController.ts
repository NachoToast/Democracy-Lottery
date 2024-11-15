import { getOrThrow } from './util';

const element = getOrThrow('input#autologin-checkbox');

const key = 'democracy-lottery-autologin';

export const autologinEnabled = localStorage.getItem(key) !== null;

element.checked = autologinEnabled;

element.onchange = (): void => {
    if (element.checked) {
        localStorage.setItem(key, 'yeah why not lol');
    } else {
        localStorage.removeItem(key);
    }
};
