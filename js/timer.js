const QUIZ_DURATION_MS = 30 * 60 * 1000; // 30 minutes
let timerInterval = null;

async function startTimer() {
  // Prevent running if quiz already submitted
  if (sessionStorage.getItem("quizSubmitted") === "true") return;

  const email = sessionStorage.getItem("email");
  if (!email) {
    document.body.innerHTML = "Session expired.";
    return;
  }

  try {
    const res = await fetch("/.netlify/functions/getStartTime?email=" + email);
    if (!res.ok) throw new Error("Failed to get start time");

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
  } catch (err) {
    console.error("Timer error:", err);
    document.body.innerHTML = "Failed to start timer.";
  }
}

function updateDisplay(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  document.getElementById("timer").innerText =
    `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function autoSubmit() {
  alert("Time is up! Your quiz will now be submitted.");
  submitQuiz(true);
}
