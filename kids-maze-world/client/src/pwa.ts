type UpdateListener = (updateReady: boolean) => void;

let registration: ServiceWorkerRegistration | undefined;
let updateReady = false;
const listeners = new Set<UpdateListener>();

function notify() {
  listeners.forEach((listener) => listener(updateReady));
}

function setUpdateReady(next: boolean) {
  updateReady = next;
  notify();
}

function watchForUpdate(nextRegistration: ServiceWorkerRegistration) {
  const installing = nextRegistration.installing;
  if (!installing) return;

  installing.addEventListener("statechange", () => {
    if (installing.state === "installed" && navigator.serviceWorker.controller) {
      setUpdateReady(true);
    }
  });
}

export function registerPwaServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((nextRegistration) => {
        registration = nextRegistration;
        if (nextRegistration.waiting && navigator.serviceWorker.controller) {
          setUpdateReady(true);
        }
        nextRegistration.addEventListener("updatefound", () => watchForUpdate(nextRegistration));
      })
      .catch((error: unknown) => {
        console.warn("PWA 离线功能注册失败，将继续以在线模式运行。", error);
      });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }, { once: true });
}

export function subscribeToPwaUpdate(listener: UpdateListener) {
  listeners.add(listener);
  listener(updateReady);
  return () => {
    listeners.delete(listener);
  };
}

export function applyPwaUpdate() {
  registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
}
