let quizData = [];
let currentIndex = 0;
let answers = {};

async function loadQuestionsFromServer() {
  try {
    console.log("Loading questions from server...");
    const res = await fetch("/.netlify/functions/getQuestions");
    if (!res.ok) throw new Error("Failed to fetch questions: " + res.status);
    const data = await res.json();

    quizData = data.questions || [];

    if (!quizData.length) {
      document.body.innerHTML = "<p>No questions available.</p>";
      return;
    }

    currentIndex = 0;
    loadQuestion();
  } catch (err) {
    console.error("Failed to load questions", err);
    document.body.innerHTML = "<p>Failed to load quiz. Check console for details.</p>";
  }
}

function loadQuestion() {
  const q = quizData[currentIndex];
  if (!q) return;

  document.getElementById("question-number").innerText =
    `Question ${currentIndex + 1} of ${quizData.length}`;

  document.getElementById("question-text").innerText = q.question;

  const img = document.getElementById("question-image");
  if (q.image) {
    img.src = q.image;
    img.style.display = "block";
  } else {
    img.style.display = "none";
  }

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  q.options.forEach((opt, i) => {
    const label = document.createElement("label");
    label.style.display = "block";
    label.style.margin = "8px 0";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "option";
    input.value = i;
    input.checked = answers[q.id] === i;
    input.onclick = () => {
      answers[q.id] = i;
      console.log("Answer set:", q.id, i);
    };

    label.appendChild(input);
    label.appendChild(document.createTextNode(" " + opt));
    optionsDiv.appendChild(label);
  });
}

document.getElementById("next-btn").addEventListener("click", () => {

  if (currentIndex < quizData.length - 1) {
    currentIndex++;
    loadQuestion();
  } else {
    console.log("All questions answered (or last pressed) - submitting...");
    submitQuiz(false); 
  }
});

loadQuestionsFromServer();

async function submitQuiz(auto = false) {
  const payload = {
  token: sessionStorage.getItem("token"),
  answers: answers,
  antiCheatLog: getAntiCheatLog(),
  warnings: 0,
  autoSubmitted: auto
};


  const res = await fetch("/.netlify/functions/submitQuiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (data.success) {
    window.location.href = "submitted.html";
  } else {
    alert("Submission failed");
  }
}






