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
  const email = event.queryStringParameters?.email;
  if (!email) {
    return { statusCode: 400, body: "Missing email" };
  }

  const snapshot = await db
    .collection("participants")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { statusCode: 404, body: "Not found" };
  }

  const data = snapshot.docs[0].data();
  const startedAt = data.startedAt.toMillis();

  return {
    statusCode: 200,
    body: JSON.stringify({ startedAt })
  };
};
