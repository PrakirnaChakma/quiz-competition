function showResultSkeleton() {
  const details = document.getElementById("result-details");
  if (!details) return;

  details.innerHTML = '';
  
  for (let i = 0; i < 5; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = `
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text skeleton-text-short"></div>
      <hr class="question-divider">
    `;
    details.appendChild(skeleton);
  }
}

async function loadResult() {
  const token = sessionStorage.getItem("token");
  
  if (!token) {
    Toast.error("Your session has expired. Please access the quiz using your original link.", "Session Expired");
    setTimeout(() => {
      window.location.href = "/";
    }, 3000);
    return;
  }

  // Show loading skeleton
  showResultSkeleton();

  try {
    const res = await fetch(`/.netlify/functions/getResult?token=${token}`);
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("Results not found. Your quiz may not have been submitted yet.");
      } else {
        throw new Error("Failed to load results from server.");
      }
    }

    const data = await res.json();

    // Animate score reveal
    revealScore(data.score, data.maxScore);

    // Render detailed results
    renderDetailedResults(data);

    // Show success message
    const percentage = Math.round((data.score / data.maxScore) * 100);
    let message = "Review your answers below.";
    
    if (percentage >= 90) {
      message = "🎉 Excellent performance! " + message;
    } else if (percentage >= 70) {
      message = "👍 Good job! " + message;
    } else if (percentage >= 50) {
      message = "Keep practicing! " + message;
    }

    Toast.success(message, "Results Loaded");

  } catch (err) {
    console.error("Result load error:", err);
    
    Toast.error(
      err.message || "Failed to load your results. Please refresh the page or contact support.",
      "Loading Failed"
    );

    const details = document.getElementById("result-details");
    if (details) {
      details.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <p style="color: var(--danger); font-size: 1.1rem;">Failed to load results</p>
          <p style="color: var(--muted-text); margin-top: 12px;">${err.message}</p>
          <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 20px;">
            Retry
          </button>
        </div>
      `;
    }
  }
}

function revealScore(score, maxScore) {
  const scoreEl = document.getElementById("score");
  if (!scoreEl) return;

  let current = 0;
  const duration = 1500; // 1.5 seconds
  const steps = 30;
  const increment = score / steps;
  const stepDuration = duration / steps;

  const interval = setInterval(() => {
    current += increment;
    if (current >= score) {
      current = score;
      clearInterval(interval);
    }
    scoreEl.innerText = `Score: ${Math.round(current)} / ${maxScore}`;
  }, stepDuration);
}

function renderDetailedResults(data) {
  const details = document.getElementById("result-details");
  if (!details) return;

  details.innerHTML = "";
  details.classList.add('page-transition');

  // Get answers snapshot from sessionStorage
  const answersSnapshot = JSON.parse(sessionStorage.getItem("answersSnapshot") || "{}");

  data.questions.forEach((q, index) => {
    const userAnswer = data.answers ? data.answers[q.id] : answersSnapshot[q.id];
    const correct = q.correctIndex;
    const isAnswered = userAnswer !== undefined;
    const isCorrect = data.detailedResults ? 
      !!data.detailedResults[q.id] : 
      (userAnswer === correct);

    // Wrapper
    const item = document.createElement("div");
    item.className = "result-question";
    item.style.animation = `fadeInUp 0.4s ease ${index * 0.05}s both`;

    // Header row with badge
    const header = document.createElement("div");
    header.className = "result-q-header";
    
    const title = document.createElement("h4");
    title.innerText = `Q${index + 1}. ${q.question}`;
    header.appendChild(title);

    // Badge (Answered/Unanswered)
    const badge = document.createElement("span");
    badge.className = "question-badge " + (isAnswered ? "answered" : "unanswered");
    badge.innerText = isAnswered ? "Answered" : "Unanswered";
    header.appendChild(badge);

    item.appendChild(header);

    // Image if any
    if (q.image) {
      const img = document.createElement("img");
      img.src = q.image;
      img.className = "question-image";
      img.alt = `Image for Q${index + 1}`;
      img.loading = "lazy";
      item.appendChild(img);
    }

    // User and correct answers
    const ua = document.createElement("p");
    ua.innerHTML = `<strong>Your answer:</strong> ${
      isAnswered ? (q.options[userAnswer] || "Unknown") : "Not answered"
    }`;
    item.appendChild(ua);

    const ca = document.createElement("p");
    ca.innerHTML = `<strong>Correct answer:</strong> ${q.options[correct]}`;
    item.appendChild(ca);

    const status = document.createElement("p");
    status.className = isCorrect ? "correct" : "wrong";
    status.innerHTML = isCorrect ? 
      "✅ Correct" : 
      (isAnswered ? "❌ Wrong" : "⚠️ Not answered");
    item.appendChild(status);

    // Marks info if available
    if (q.marks && q.marks > 1) {
      const marksInfo = document.createElement("p");
      marksInfo.style.fontSize = "0.9rem";
      marksInfo.style.color = "var(--muted-text)";
      marksInfo.innerText = `Worth ${q.marks} marks`;
      item.appendChild(marksInfo);
    }

    details.appendChild(item);

    // Divider
    const divider = document.createElement("hr");
    divider.className = "question-divider";
    details.appendChild(divider);
  });

  // Summary statistics
  const summary = createSummaryStats(data);
  details.appendChild(summary);

  // Bottom notes
  const note = document.getElementById("bottom-note");
  if (note) {
    const percentage = Math.round((data.score / data.maxScore) * 100);
    note.innerHTML = `
      <strong>Performance: ${percentage}%</strong><br>
      ${getPerformanceMessage(percentage)}
    `;
  }
}

function createSummaryStats(data) {
  const wrapper = document.createElement("div");
  wrapper.className = "result-bottom-notes";
  wrapper.style.marginTop = "30px";

  const answered = Object.keys(data.answers || {}).length;
  const correct = Object.values(data.detailedResults || {}).filter(Boolean).length;
  const wrong = answered - correct;
  const unanswered = data.questions.length - answered;
  const percentage = Math.round((data.score / data.maxScore) * 100);

  wrapper.innerHTML = `
    <h4>Summary Statistics</h4>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 12px;">
      <div style="padding: 12px; background: rgba(76, 175, 80, 0.1); border-radius: 8px; border: 1px solid rgba(76, 175, 80, 0.3);">
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--success);">${correct}</div>
        <div style="font-size: 0.85rem; color: var(--muted-text);">Correct</div>
      </div>
      <div style="padding: 12px; background: rgba(244, 67, 54, 0.1); border-radius: 8px; border: 1px solid rgba(244, 67, 54, 0.3);">
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--danger);">${wrong}</div>
        <div style="font-size: 0.85rem; color: var(--muted-text);">Wrong</div>
      </div>
      <div style="padding: 12px; background: rgba(255, 152, 0, 0.1); border-radius: 8px; border: 1px solid rgba(255, 152, 0, 0.3);">
        <div style="font-size: 1.5rem; font-weight: 700; color: #ff9800;">${unanswered}</div>
        <div style="font-size: 0.85rem; color: var(--muted-text);">Unanswered</div>
      </div>
      <div style="padding: 12px; background: rgba(138, 43, 226, 0.1); border-radius: 8px; border: 1px solid rgba(138, 43, 226, 0.3);">
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-light);">${percentage}%</div>
        <div style="font-size: 0.85rem; color: var(--muted-text);">Score</div>
      </div>
    </div>
  `;

  return wrapper;
}

function getPerformanceMessage(percentage) {
  if (percentage >= 90) {
    return "Outstanding! আপনি বিষয়বস্তু সম্পর্কে চমৎকার বোঝাপড়া প্রদর্শন করেছেন। আমাদের সাথে যুক্ত থাকুন— RGHS Refiners।";
  } else if (percentage >= 80) {
    return "Great work! আপনার Concept/ধারণাগুলোর ওপর দৃঢ় দখল রয়েছে। আরও উন্নতির জন্য আমাদের সাথে যুক্ত থাকুন — RGHS Refiners ";
  } else if (percentage >= 70) {
    return "Good job! আপনি সঠিক পথে এগোচ্ছেন। উন্নতির জন্য ভুল উত্তরগুলো পর্যালোচনা করুন। সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন — RGHS Refiners";
  } else if (percentage >= 60) {
    return "Fair performance. বিষয়বস্তু পুনরায় পর্যালোচনা করা এবং আরও অনুশীলন করার কথা বিবেচনা করুন। সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন — RGHS Refiners";
  } else if (percentage >= 50) {
    return "You passed.আপনি উত্তীর্ণ হয়েছেন, তবে উন্নতির সুযোগ রয়েছে। যেসব অংশে আপনি সমস্যায় পড়েছেন সেগুলোর ওপর মনোযোগ দিন এবং সহায়তার জন্য আমাদের সাথে যোগাযোগ করতে দ্বিধা করবেন না — RGHS Refiners";
  } else {
    return "Practice more! অনুশীলন চালিয়ে যান! বিষয়বস্তু ভালোভাবে পর্যালোচনা করুন এবং সহায়তা চাইতে দ্বিধা করবেন না। সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন — RGHS Refiners";
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadResult);
} else {
  loadResult();
}