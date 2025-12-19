let quizData = [];
let answers = {};
let submitted = false;
let autoSaveTimeout = null;

// ---------- LOADING UTILITIES ----------

function showLoader(message = 'Loading...') {
  // Remove any existing loader first
  hideLoader();
  
  const loader = document.createElement('div');
  loader.id = 'app-loader';
  loader.className = 'spinner-overlay';
  loader.innerHTML = `
    <div class="spinner-container">
      <div class="spinner"></div>
      <div class="spinner-text">${message}</div>
    </div>
  `;
  document.body.appendChild(loader);
  return loader;
}

function hideLoader() {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      if (loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    }, 200);
  }
}

// ---------- SKELETON LOADING ----------

function showSkeletons(count = 3) {
  const container = document.getElementById('quiz-container');
  if (!container) return;
  
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = `
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-option"></div>
      <div class="skeleton skeleton-option"></div>
      <div class="skeleton skeleton-option"></div>
      <div class="skeleton skeleton-option"></div>
    `;
    container.appendChild(skeleton);
  }
}

// ---------- AUTO-SAVE FUNCTIONALITY ----------

const AutoSave = {
  indicator: null,
  
  init() {
    if (!this.indicator) {
      this.indicator = document.createElement('div');
      this.indicator.className = 'autosave-indicator';
      this.indicator.innerHTML = `
        <svg class="autosave-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        <span class="autosave-text">Saved</span>
      `;
      document.body.appendChild(this.indicator);
    }
  },

  show(status = 'saved', message = 'Saved') {
    this.init();
    this.indicator.className = `autosave-indicator show ${status}`;
    const textEl = this.indicator.querySelector('.autosave-text');
    if (textEl) textEl.textContent = message;
    
    const icon = this.indicator.querySelector('.autosave-icon');
    if (icon) icon.classList.toggle('spinning', status === 'saving');

    if (status !== 'saving') {
      setTimeout(() => {
        this.indicator.classList.remove('show');
      }, 2000);
    }
  },

  hide() {
    if (this.indicator) {
      this.indicator.classList.remove('show');
    }
  }
};

function scheduleAutoSave() {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  AutoSave.show('saving', 'Saving...');

  autoSaveTimeout = setTimeout(() => {
    saveAnswersLocally();
    AutoSave.show('saved', 'Auto-saved');
  }, 1000);
}

function saveAnswersLocally() {
  try {
    sessionStorage.setItem('quiz_answers_draft', JSON.stringify(answers));
    sessionStorage.setItem('quiz_answers_timestamp', Date.now().toString());
    return true;
  } catch (err) {
    console.error('Auto-save failed:', err);
    AutoSave.show('error', 'Save failed');
    return false;
  }
}

function loadSavedAnswers() {
  try {
    const saved = sessionStorage.getItem('quiz_answers_draft');
    if (saved) {
      const savedAnswers = JSON.parse(saved);
      const timestamp = sessionStorage.getItem('quiz_answers_timestamp');
      
      if (timestamp) {
        const savedTime = new Date(parseInt(timestamp));
        const minutesAgo = Math.floor((Date.now() - savedTime) / 60000);
        
        if (minutesAgo < 60) {
          if (window.Toast) {
            Toast.info(
              `Restored ${Object.keys(savedAnswers).length} saved answers from ${minutesAgo} minutes ago`,
              'Progress Restored'
            );
          }
          return savedAnswers;
        }
      }
    }
  } catch (err) {
    console.error('Failed to load saved answers:', err);
  }
  return {};
}

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
    if (sessionStorage.getItem("quizSubmitted") === "true") {
      document.body.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <h2>You have already submitted the quiz. কুইজটি ইতিমধ্যে সাবমিট হয়েছে।</h2>
          <p style="color: var(--muted-text); margin-top: 12px;">
            Please check your email for results or keep an eye on our Facebook page. Additionally contact the administrator through our website. বিস্তারিত দেখতে ওয়েবসাইট চেক করো।
          </p>
        </div>
      `;
      return;
    }

    showSkeletons(5);

    const res = await fetch("/.netlify/functions/getQuestions");
    
    if (!res.ok) {
      throw new Error("Failed to fetch questions");
    }

    const data = await res.json();
    quizData = shuffleArray(data.questions || []);

    if (!quizData.length) {
      if (window.Toast) {
        Toast.error("No questions are currently available.", "No Questions");
      }
      const container = document.getElementById('quiz-container');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px 20px;">
            <p style="font-size: 1.2rem;">No questions available.</p>
          </div>
        `;
      }
      return;
    }

    const savedAnswers = loadSavedAnswers();
    if (Object.keys(savedAnswers).length > 0) {
      answers = savedAnswers;
    }

    renderAllQuestions();
    
    if (window.Toast) {
      Toast.success(`Loaded ${quizData.length} questions successfully`, 'Quiz Ready');
    }

  } catch (err) {
    console.error('Load error:', err);
    if (window.Toast) {
      Toast.error('Failed to load quiz questions. Please refresh the page.', 'Loading Failed');
    }
    
    const container = document.getElementById('quiz-container');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <p style="font-size: 1.2rem; color: var(--danger);">Failed to load quiz</p>
          <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 20px;">
            Retry
          </button>
        </div>
      `;
    }
  }
}

// ---------- RENDER ----------

function renderAllQuestions() {
  const container = document.getElementById("quiz-container");
  if (!container) return;
  
  container.innerHTML = "";
  container.classList.add('page-transition');

  quizData.forEach((q, index) => {
    const qCard = document.createElement("div");
    qCard.className = "question-card";
    qCard.dataset.questionId = q.id;

    const badge = document.createElement("span");
    badge.className = "question-badge unanswered";
    badge.dataset.qid = q.id;
    badge.innerText = "Unanswered";
    qCard.appendChild(badge);

    const title = document.createElement("h3");
    title.innerText = `Q${index + 1}. ${q.question}`;
    qCard.appendChild(title);

    if (q.image) {
      const img = document.createElement("img");
      img.src = q.image;
      img.alt = `Image for Q${index + 1}`;
      img.className = "question-image";
      img.loading = "lazy";
      qCard.appendChild(img);
    }

    const shuffledOptions = shuffleArray(
      q.options.map((opt, i) => ({ text: opt, originalIndex: i }))
    );

    const optionsDiv = document.createElement("div");
    optionsDiv.className = "options-list";

    shuffledOptions.forEach(optObj => {
      const label = document.createElement("label");
      label.className = "option-label";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = q.id;
      input.value = optObj.originalIndex;
      
      if (answers[q.id] === optObj.originalIndex) {
        input.checked = true;
      }

      input.onclick = () => {
        answers[q.id] = optObj.originalIndex;
        updateProgress();
        markAnswered(q.id);
        scheduleAutoSave();
      };

      label.appendChild(input);
      const span = document.createElement("span");
      span.innerText = optObj.text;
      label.appendChild(span);

      optionsDiv.appendChild(label);
    });

    qCard.appendChild(optionsDiv);
    container.appendChild(qCard);
  });

  updateProgress();
  Object.keys(answers).forEach(qid => markAnswered(qid));
}

// ---------- PROGRESS & BADGES ----------

function updateProgress() {
  const answered = Object.keys(answers).length;
  const progressEl = document.getElementById("progress");
  if (progressEl) {
    progressEl.innerText = `Answered ${answered} / ${quizData.length}`;
  }
}

function markAnswered(qid) {
  const badge = document.querySelector(`.question-badge[data-qid="${qid}"]`);
  if (!badge) return;
  badge.classList.remove("unanswered");
  badge.classList.add("answered");
  badge.innerText = "Answered";
}

// ---------- MODAL ----------

function openConfirmModal() {
  const unanswered = quizData.length - Object.keys(answers).length;
  
  if (unanswered > 0 && window.Toast) {
    Toast.warning(
      `You have ${unanswered} unanswered question(s). You can still submit.`,
      'Incomplete Quiz'
    );
  }

  const modal = document.getElementById("confirm-modal");
  if (modal) {
    modal.classList.remove("modal-hidden");
    modal.classList.add("modal-visible");
  }
}

function closeConfirmModal() {
  const modal = document.getElementById("confirm-modal");
  if (modal) {
    modal.classList.remove("modal-visible");
    modal.classList.add("modal-hidden");
  }
}

// ---------- SUBMIT (FIXED) ----------

async function submitQuiz(auto = false) {
  if (submitted) {
    console.log('Already submitted, skipping...');
    return;
  }
  
  console.log('Starting quiz submission...');
  submitted = true;

  const loader = showLoader('Submitting your quiz...');

  // Disable all inputs immediately
  document.querySelectorAll("input, button").forEach(el => el.disabled = true);

  const token = sessionStorage.getItem("token");
  const antiCheatLog = window.getAntiCheatLog ? window.getAntiCheatLog() : {};

  const payload = {
    token: token,
    answers: answers,
    antiCheatLog: antiCheatLog,
    autoSubmitted: auto
  };

  console.log('Payload:', { token, answerCount: Object.keys(answers).length, auto });

  try {
    const res = await fetch("/.netlify/functions/submitQuiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', res.status);

    if (res.status === 403) {
      hideLoader();
      if (window.Toast) {
        Toast.error('This quiz has already been submitted.', 'Already Submitted');
      } else {
        alert('This quiz has already been submitted.');
      }
      return;
    }

    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }

    const data = await res.json();
    console.log('Response data:', data);
    
    if (data.success) {
      console.log('Submission successful, setting session storage...');
      
      // Set session storage
      sessionStorage.setItem("quizSubmitted", "true");
      sessionStorage.setItem("answersSnapshot", JSON.stringify(answers));
      
      // Clear auto-save data
      sessionStorage.removeItem('quiz_answers_draft');
      sessionStorage.removeItem('quiz_answers_timestamp');
      
      console.log('Session storage set, preparing redirect...');
      
      // Hide loader
      hideLoader();
      
      // Show success toast
      if (window.Toast) {
        Toast.success('Your quiz has been submitted successfully!', 'Submission Complete');
      }
      
      // Redirect after short delay
      console.log('Redirecting to submitted.html in o.5 second...');
      setTimeout(() => {
        console.log('Executing redirect now...');
        window.location.href = "./submitted.html";
      }, 500);
      
    } else {
      throw new Error('Submission failed: success was false');
    }
    
  } catch (err) {
    console.error('Submit error:', err);
    hideLoader();
    
    if (window.Toast) {
      Toast.error(
        'Failed to submit your quiz. Please check your connection and try again.',
        'Submission Failed'
      );
    } else {
      alert('Failed to submit quiz. Please try again.');
    }
    
    // Re-enable inputs on error
    document.querySelectorAll("input, button").forEach(el => el.disabled = false);
    submitted = false;
  }
}

// ---------- INITIALIZATION ----------

function initializeQuiz() {
  console.log('Initializing quiz...');
  
  loadQuestionsFromServer();
  wireFloatingControls();
  setupModalHandlers();
  AutoSave.init();

  window.addEventListener('beforeunload', (e) => {
    if (!submitted && Object.keys(answers).length > 0) {
      e.preventDefault();
      e.returnValue = 'You have unsaved progress. Are you sure you want to leave?';
      return e.returnValue;
    }
  });
}

function setupModalHandlers() {
  const cancelBtn = document.getElementById("modal-cancel");
  const confirmBtn = document.getElementById("modal-confirm");
  const backdrop = document.getElementById("modal-backdrop");

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      console.log('Cancel clicked');
      closeConfirmModal();
    };
  }
  
  if (backdrop) {
    backdrop.onclick = () => {
      console.log('Backdrop clicked');
      closeConfirmModal();
    };
  }

  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      console.log('Confirm clicked');
      closeConfirmModal();
      await submitQuiz(false);
    };
  }
}

function wireFloatingControls() {
  const floatTimer = document.getElementById("floating-timer");
  const floatSubmit = document.getElementById("floating-submit");
  const originalSubmit = document.getElementById("original-submit");

  setInterval(() => {
    const mainTimer = document.getElementById("timer");
    if (mainTimer && floatTimer) {
      floatTimer.innerText = mainTimer.innerText;
    }
  }, 400);

  if (floatSubmit) {
    floatSubmit.addEventListener("click", () => {
      console.log('Floating submit clicked');
      openConfirmModal();
    });
  }

  if (originalSubmit) {
    originalSubmit.addEventListener("click", (e) => {
      e.preventDefault();
      console.log('Original submit clicked');
      openConfirmModal();
    });
  }
}

// ---------- START ----------

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeQuiz);
} else {
  initializeQuiz();
}

// Export for timer.js
window.submitQuiz = submitQuiz;
