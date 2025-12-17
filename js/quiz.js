const quizData = [
  {
    question: "What is the capital of Bangladesh?",
    image: "",
    options: ["Dhaka", "Chittagong", "Khulna", "Rajshahi"],
    correct: 0
  },
  {
    question: "Identify this symbol:",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/77/Google_Images_2015_logo.svg",
    options: ["Google", "Facebook", "Twitter", "Microsoft"],
    correct: 0
  }
];

// Shuffle helper
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// Shuffle questions
shuffle(quizData);

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
    input.onclick = () => answers[current] = i;

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
    alert("Quiz finished (submission next phase)");
  }
};

loadQuestion();

async function submitQuiz(auto = false) {
  const payload = {
    token: sessionStorage.getItem("token"),
    answers: userAnswers,
    antiCheatLog: getAntiCheatLog(),
    warnings: warningCount,
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
