const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  try {
    const { token, answers, antiCheatLog, autoSubmitted } = JSON.parse(event.body);

    if (!token || !answers) {
      return { statusCode: 400, body: "Invalid submission" };
    }

    const submissionRef = db.collection("submissions").doc(token);
    const existing = await submissionRef.get();
    if (existing.exists) {
      return { statusCode: 403, body: JSON.stringify({ success: false }) };
    }

    let score = 0;
    let maxScore = 0;
    const detailedResults = {};

    const questionsSnap = await db.collection("questions").get();

    questionsSnap.forEach((doc) => {
      const q = doc.data();
      const qid = doc.id;

      maxScore += q.marks || 1;
      const userAnswer = answers[qid];
      const correct = q.correctIndex;

      detailedResults[qid] = userAnswer === correct;
      if (userAnswer === correct) score += q.marks || 1;
    });

    await submissionRef.set({
      token,
      answers,
      score,
      maxScore,
      detailedResults,
      antiCheatLog,
      autoSubmitted,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Submit error:", err);
    return { statusCode: 500, body: JSON.stringify({ success: false }) };
  }
};
