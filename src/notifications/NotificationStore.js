let notifications = [];

const listeners = new Set();

function emit() {
  const snapshot = [...notifications];

  for (const listener of listeners) {
    listener(snapshot);
  }
}

export function getNotifications() {
  return [...notifications];
}

export function subscribe(listener) {
  listeners.add(listener);

  listener([...notifications]);

  return () => {
    listeners.delete(listener);
  };
}

export function addNotification(notification) {
  const id =
    Date.now().toString(36) +
    Math.random().toString(36).slice(2);

  const item = {
    id,
    ...notification,
  };

  notifications = [...notifications, item];

  emit();

  return item.id;
}

export function removeNotification(id) {
  notifications = notifications.filter(
    (notification) => notification.id !== id
  );

  emit();
}

export function clearNotifications() {
  notifications = [];

  emit();
}