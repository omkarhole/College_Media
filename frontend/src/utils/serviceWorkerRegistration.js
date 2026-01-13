/**
 * Service Worker Registration
 * Issue #249: PWA Implementation
 */

export const register = () => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("✅ Service Worker registered:", registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour

          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;

            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New service worker available
                if (confirm("New version available! Reload to update?")) {
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });
    });

    // Handle service worker messages
    navigator.serviceWorker.addEventListener("message", (event) => {
      console.log("Message from SW:", event.data);

      if (event.data.type === "CACHE_UPDATED") {
        console.log("Cache updated:", event.data.url);
      }
    });
  } else {
    console.warn("Service Workers not supported in this browser");
  }
};

export const unregister = () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log("Service Worker unregistered");
      })
      .catch((error) => {
        console.error("Error unregistering Service Worker:", error);
      });
  }
};

// Check if service worker is controlling the page
export const isControlled = () => {
  return navigator.serviceWorker && navigator.serviceWorker.controller !== null;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ""
      ),
    });

    console.log("Push subscription:", subscription);
    return subscription;
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    return null;
  }
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
