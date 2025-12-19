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
    const token = event.queryStringParameters?.token;
    if (!token) {
      return { statusCode: 400, body: "Missing token" };
    }

    const submissionSnap = await db.collection("submissions").doc(token).get();
    if (!submissionSnap.exists) {
      return { statusCode: 404, body: "No submission found" };
    }

    const submission = submissionSnap.data();

    // Fetch all questions
    const questionsSnap = await db.collection("questions").get();
    const questions = [];

    questionsSnap.forEach(doc => {
      const q = doc.data();
      questions.push({
        id: doc.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        marks: q.marks || 1,
        image: q.image || ""
        });
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        score: submission.score,
        maxScore: submission.maxScore,
        answers: submission.answers,
        detailedResults: submission.detailedResults,
        questions
      })
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  }
};
