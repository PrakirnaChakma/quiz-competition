const QUIZ_DURATION_MS = 30 * 60 * 1000; // 30 minutes

let timerInterval = null;

async function startTimer() {
  const email = sessionStorage.getItem("email");
  if (!email) {
    document.body.innerHTML = "Session expired.";
    return;
  }

  const res = await fetch("/.netlify/functions/getStartTime?email=" + email);
  const data = await res.json();

  const startTime = data.startedAt;
  const endTime = startTime + QUIZ_DURATION_MS;

  timerInterval = setInterval(() => {
    const now = Date.now();
    const remaining = endTime - now;

    if (remaining <= 0) {
      clearInterval(timerInterval);
      autoSubmit();
      return;
    }

    updateDisplay(remaining);
  }, 1000);
}

function updateDisplay(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  document.getElementById("timer").innerText =
    `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

