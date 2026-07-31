import {
  addNotification,
} from "./NotificationStore";

const DEFAULT_DURATION = 2500;

function notify(type, message, options = {}) {
  return addNotification({
    type,
    message,

    title: options.title ?? null,

    duration:
      options.duration ?? DEFAULT_DURATION,

    icon: options.icon ?? null,
  });
}

export function notifySuccess(
  message,
  options
) {
  return notify(
    "success",
    message,
    options
  );
}

export function notifyInfo(
  message,
  options
) {
  return notify(
    "info",
    message,
    options
  );
}

export function notifyWarning(
  message,
  options
) {
  return notify(
    "warning",
    message,
    options
  );
}

export function notifyError(
  message,
  options
) {
  return notify(
    "error",
    message,
    options
  );
}