import { socket } from './socket';
import { ServerEvents } from './types/shared';
import { getOrThrow } from './util';

const views = ['login-view', 'admin-view', 'user-view'] as const;

type View = (typeof views)[number];

const allPages = new Map<View, HTMLElement>(
    views.map((view) => [view, getOrThrow(`section#${view}`)]),
);

let activeView: View | null = null;

export function setActiveView(newView: View): void {
    if (activeView === newView) {
        return;
    }

    const oldPage = activeView ? allPages.get(activeView) : undefined;

    if (oldPage) {
        oldPage.hidden = true;
    }

    const newPage = allPages.get(newView);

    if (newPage) {
        newPage.hidden = false;
    }

    activeView = newView;
}

socket.on(ServerEvents.User.Accepted, (user) => {
    if (user.isAdmin) {
        setActiveView('admin-view');
    } else {
        setActiveView('user-view');
    }
});

socket.on(ServerEvents.User.Rejected, () => {
    setActiveView('login-view');
});

socket.on('disconnect', () => {
    setActiveView('login-view');
});
