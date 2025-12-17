const admin = require("firebase-admin");

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
  const token = event.queryStringParameters?.token;

  if (!token) {
    return { statusCode: 400, body: "Missing token" };
  }

  const snapshot = await db
    .collection("participants")
    .where("token", "==", token)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { statusCode: 403, body: "Invalid token" };
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  if (data.used) {
    return { statusCode: 403, body: "Token already used" };
  }

  // Mark token as used
  await doc.ref.update({
    used: true,
    startedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ email: data.email })
  };
};
