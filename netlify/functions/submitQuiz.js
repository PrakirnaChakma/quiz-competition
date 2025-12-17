const admin = require("firebase-admin");
console.log("FIREBASE_SERVICE_ACCOUNT:", process.env.FIREBASE_SERVICE_ACCOUNT ? "exists" : "MISSING");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}


const db = admin.firestore();

exports.handler = async (event) => {
  const { token, answers, antiCheatLog, warnings, autoSubmitted } =
    JSON.parse(event.body);

  if (!token) {
    return { statusCode: 400, body: "No token" };
  }

  const ref = db.collection("submissions").doc(token);
  const existing = await ref.get();

  if (existing.exists) {
    return {
      statusCode: 403,
      body: JSON.stringify({ success: false })
    };
  }

  await ref.set({
    token,
    answers,
    antiCheatLog,
    warnings,
    autoSubmitted,
    submittedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};


