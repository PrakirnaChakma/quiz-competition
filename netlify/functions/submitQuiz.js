const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  const { token, answers, antiCheatLog, warnings, autoSubmitted } = JSON.parse(event.body);

  if (!token) {
    return { statusCode: 400, body: "No token" };
  }

  const ref = db.collection("submissions").doc(token);
  const existing = await ref.get();

  if (existing.exists) {
    return { statusCode: 403, body: JSON.stringify({ success: false }) };
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
console.log("Received submission:", token);


