// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendDailyNotifications = functions.pubsub
  .schedule("every day 08:00")
  .timeZone("YOUR_TIME_ZONE") // e.g., "America/New_York"
  .onRun(async (context) => {
    const usersSnapshot = await admin.firestore().collection("users").get();
    usersSnapshot.forEach(async (userDoc) => {
      const user = userDoc.data();
      const fcmToken = user.fcmToken; // Ensure you store FCM tokens for users
      if (fcmToken) {
        const message = {
          notification: {
            title: "Time to Run!",
            body: "Come back and complete your daily run goal.",
          },
          token: fcmToken,
        };
        try {
          await admin.messaging().send(message);
          console.log("Notification sent to:", userDoc.id);
        } catch (error) {
          console.error("Error sending notification to:", userDoc.id, error);
        }
      }
    });
    return null;
  });
