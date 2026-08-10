import { useEffect, useRef, useState } from "react";

import "./NotificationToast.css";

import {
  getNotifications,
  subscribe,
  removeNotification,
} from "../../notifications/NotificationStore";

function NotificationToast() {
  const [notifications, setNotifications] = useState(
    getNotifications()
  );

  const timers = useRef(new Map());

  useEffect(() => {
    return subscribe(setNotifications);
  }, []);

  useEffect(() => {
    for (const notification of notifications) {
      if (notification.duration <= 0) {
        continue;
      }

      if (timers.current.has(notification.id)) {
        continue;
      }

      const timer = setTimeout(() => {
        timers.current.delete(notification.id);
        removeNotification(notification.id);
      }, notification.duration);

      timers.current.set(notification.id, timer);
    }
  }, [notifications]);

  useEffect(() => {
    const activeTimers = timers.current;

    return () => {
      for (const timer of activeTimers.values()) {
        clearTimeout(timer);
      }

      activeTimers.clear();
    };
  }, []);

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
        >
          {notification.title && (
            <strong>{notification.title}</strong>
          )}

          <span>{notification.message}</span>
        </div>
      ))}
    </div>
  );
}

export default NotificationToast;
