const antiCheatLog = {
  tabSwitches: 0,
  fullscreenExits: 0,
  copyAttempts: 0,
  pasteAttempts: 0,
  refreshes: 0,
  blurEvents: 0
};

let fullscreenEnabled = false;
let fullscreenPromptShown = false;

// Fullscreen enforcement - called on user interaction
function enforceFullscreen() {
  if (fullscreenEnabled || fullscreenPromptShown) return;
  
  // Show a prompt on first page load
  if (!fullscreenPromptShown && window.Toast) {
    fullscreenPromptShown = true;
    
    // Create a clickable notification
    setTimeout(() => {
      Toast.info(
        'Click anywhere on the page to enable fullscreen mode for better focus.',
        '🖥️ Fullscreen Mode',
        { duration: 8000 }
      );
    }, 1000);
  }
}

// Request fullscreen on any user click
function requestFullscreenOnInteraction() {
  if (fullscreenEnabled || document.fullscreenElement) return;
  
  document.documentElement.requestFullscreen().then(() => {
    fullscreenEnabled = true;
    if (window.Toast) {
      Toast.success('Fullscreen mode activated', 'Focus Mode', { duration: 2000 });
    }
  }).catch((err) => {
    console.warn('Fullscreen request failed:', err);
  });
}

// Listen for first user interaction
document.addEventListener('click', requestFullscreenOnInteraction, { once: true });

// Fullscreen change monitoring
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && fullscreenEnabled) {
    antiCheatLog.fullscreenExits++;
    console.warn("Exited fullscreen");
    
    if (window.Toast) {
      Toast.warning(
        'You exited fullscreen mode. Click to re-enable for better focus.',
        'Fullscreen Exited'
      );
    }
    
    // Allow re-entering fullscreen on next click
    fullscreenEnabled = false;
    document.addEventListener('click', requestFullscreenOnInteraction, { once: true });
  }
});

// Tab switching detection
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
  
  if (window.Toast) {
    Toast.warning('Copying is disabled during the quiz.', 'Copy Blocked');
  }
});

document.addEventListener("paste", (e) => {
  e.preventDefault();
  antiCheatLog.pasteAttempts++;
});

// Context menu blocking (right-click)
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (window.Toast) {
    Toast.warning('Right-click is disabled during the quiz.', 'Context Menu Blocked');
  }
});

// Refresh detection
window.addEventListener("beforeunload", () => {
  antiCheatLog.refreshes++;
  sessionStorage.setItem("antiCheatLog", JSON.stringify(antiCheatLog));
});

// Restore log on reload
const savedLog = sessionStorage.getItem("antiCheatLog");
if (savedLog) {
  try {
    Object.assign(antiCheatLog, JSON.parse(savedLog));
  } catch (e) {
    console.error('Failed to restore anti-cheat log:', e);
  }
}

// Expose for submission
window.getAntiCheatLog = () => antiCheatLog;

// Safe export of enforceFullscreen
window.enforceFullscreen = enforceFullscreen;
