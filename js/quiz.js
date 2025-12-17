let quizData = [];
let current = 0;
let answers = {};

async function loadQuestionsFromServer() {
  try {
    const res = await fetch("/.netlify/functions/getQuestions");
    const data = await res.json();

    quizData = data.questions;

    if (!quizData.length) {
      document.body.innerHTML = "No questions available.";
      return;
    }

    loadQuestion();
  } catch (err) {
    console.error("Failed to load questions", err);
    document.body.innerHTML = "Failed to load quiz.";
  }
}

// Shuffle helper
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// Store user answers
let current = 0;
let answers = new Array(quizData.length).fill(null);

// Render question
function loadQuestion() {
  const q = quizData[current];
  document.getElementById("question-number").innerText =
    `Question ${current + 1} of ${quizData.length}`;

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

  const shuffledOptions = q.options
    .map((opt, i) => ({ opt, i }))
    .sort(() => Math.random() - 0.5);

  shuffledOptions.forEach(({ opt, i }) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "option";
    input.checked = answers[current] === i;
    input.onclick = () => {
  answers[q.id] = i;
};


    label.appendChild(input);
    label.append(" " + opt);
    optionsDiv.appendChild(label);
    optionsDiv.appendChild(document.createElement("br"));
  });
}

document.getElementById("next-btn").onclick = () => {
  if (current < quizData.length - 1) {
    current++;
    loadQuestion();
  } else {
  submitQuiz(false);
}
};

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





