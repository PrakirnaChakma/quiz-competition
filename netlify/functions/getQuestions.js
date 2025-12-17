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

exports.handler = async () => {
  try {
    const snapshot = await db
      .collection("questions")
      .orderBy("order")
      .get();

    const questions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        question: data.question,
        options: data.options,
        image: data.image || ""
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ questions }),
    };

  } catch (err) {
    console.error("getQuestions error:", err);
    return {
      statusCode: 500,
      body: "Failed to load questions",
    };
  }
};
