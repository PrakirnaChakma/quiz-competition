let quizData = [];
let answers = {};

// ---------- HELPERS ----------
function shuffleArray(arr) {
  return arr
    .map(v => ({ v, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ v }) => v);
}

// ---------- LOAD QUESTIONS ----------
async function loadQuestionsFromServer() {
  try {
    const res = await fetch("/.netlify/functions/getQuestions");
    if (!res.ok) throw new Error("Failed to fetch questions");

    const data = await res.json();
    quizData = shuffleArray(data.questions || []);

    if (!quizData.length) {
      document.body.innerHTML = "No questions available.";
      return;
    }

    renderAllQuestions();
  } catch (err) {
    console.error(err);
    document.body.innerHTML = "Failed to load quiz.";
  }
}

// ---------- RENDER ----------
function renderAllQuestions() {
  const container = document.getElementById("quiz-container");
  container.innerHTML = "";

  quizData.forEach((q, index) => {
    const qDiv = document.createElement("div");
    qDiv.style.marginBottom = "30px";

    const title = document.createElement("h3");
    title.innerText = `Q${index + 1}. ${q.question}`;
    qDiv.appendChild(title);

    if (q.image) {
      const img = document.createElement("img");
      img.src = q.image;
      img.style.maxWidth = "300px";
      img.style.display = "block";
      img.style.marginBottom = "10px";
      qDiv.appendChild(img);
    }

    // Shuffle options WITH mapping
    const shuffledOptions = shuffleArray(
      q.options.map((opt, i) => ({ text: opt, originalIndex: i }))
    );

    shuffledOptions.forEach(optObj => {
      const label = document.createElement("label");
      label.style.display = "block";
      label.style.cursor = "pointer";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = q.id;
      input.onclick = () => {
        answers[q.id] = optObj.originalIndex;
      };

      label.appendChild(input);
      label.append(" " + optObj.text);
      qDiv.appendChild(label);
    });

    container.appendChild(qDiv);
  });
}

// ---------- SUBMIT ----------
async function submitQuiz(auto = false) {
  const confirmSubmit = auto || confirm("Are you sure you want to submit the quiz?");
  if (!confirmSubmit) return;

  const payload = {
    token: sessionStorage.getItem("token"),
    answers,
    antiCheatLog: getAntiCheatLog(),
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

// ---------- START ----------
loadQuestionsFromServer();
