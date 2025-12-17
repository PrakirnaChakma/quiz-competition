const antiCheatLog = {
  tabSwitches: 0,
  fullscreenExits: 0,
  copyAttempts: 0,
  pasteAttempts: 0,
  refreshes: 0,
  blurEvents: 0
};

// Fullscreen enforcement
function enforceFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    antiCheatLog.fullscreenExits++;
    console.warn("Exited fullscreen");
  }
});

// Tab switching
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    antiCheatLog.tabSwitches++;
    console.warn("Tab switched");
  }
});

// Window blur (alt-tab, minimize)
window.addEventListener("blur", () => {
  antiCheatLog.blurEvents++;
});

// Copy / paste blocking
document.addEventListener("copy", (e) => {
  e.preventDefault();
  antiCheatLog.copyAttempts++;
});

document.addEventListener("paste", (e) => {
  e.preventDefault();
  antiCheatLog.pasteAttempts++;
});

// Refresh detection
window.addEventListener("beforeunload", () => {
  antiCheatLog.refreshes++;
  sessionStorage.setItem("antiCheatLog", JSON.stringify(antiCheatLog));
});

// Restore log on reload
const savedLog = sessionStorage.getItem("antiCheatLog");
if (savedLog) {
  Object.assign(antiCheatLog, JSON.parse(savedLog));
}

// Expose for submission
window.getAntiCheatLog = () => antiCheatLog;
