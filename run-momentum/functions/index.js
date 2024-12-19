const functions = require("firebase-functions/v2");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();
const {OpenAI} = require("openai");

// Initialize OpenAI and Firebase Admin
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Replace with your OpenAI API key
});

admin.initializeApp();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
exports.sendDailyEmails = onSchedule(
    "*/5 * * * *", async (context) => {
      const db = admin.firestore();
      const usersCollection = db.collection("users");

      try {
        const snapshot = await usersCollection.get();
        const users = snapshot.docs.map((doc) => doc.data());
        console.log("Users:", users);

        const emailPromises = users.map((user) => {
          if (true) {
            const msg = {
              to: "uche@uni.minerva.edu",
              from: "uchechij15@gmail.com",
              subject: "🌟 Stay on Track with Your Goals! 🌟",
              text: `Hello,

                We hope this message finds you well! Here's your friendly reminder to log in and track your progress today. Remember, every step you take brings you closer to achieving your goals!

                Click below to log in and keep your streak alive:

                [Log in Now](https://your-app-link.com)

                Stay motivated, and let’s make today count!

                Best regards,
                The Motivation Team`,
                  html: `
                    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                      <h2 style="color: #4CAF50;">🌟 Stay on Track with Your Goals! 🌟</h2>
                      <p>Hi there,</p>
                      <p>We hope this message finds you well! Here's your friendly reminder to log in and track your progress today. Remember, every step you take brings you closer to achieving your goals!</p>
                      <a href="https://your-app-link.com" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">Log in Now</a>
                      <p style="margin-top: 20px;">Stay motivated, and let’s make today count!</p>
                      <p>Best regards,<br/><strong>The Motivation Team</strong></p>
                    </div>
                  `,
                  };
            return sgMail.send(msg);
          }
        });

        await Promise.all(emailPromises);
        console.log("Daily emails sent successfully.");
      } catch (error) {
        console.error("Error sending daily emails:", error);
      }

      return null;
    });

exports.generateFeedback = functions.https.onCall(async (data, context) => {
  console.log("Auth context:", context.auth);
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be signed in.");
  }
  console.log("Data:", data);
  const history = data.data?.history; // Expect run history array
  console.log("History:", history);

  if (!history || !Array.isArray(history) || history.length === 0) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "History is not properly formatted or is empty.",
    );
  }

  // Construct a prompt for the AI
  const systemPrompt = `
    You are a motivational assistant 
    for users aiming to develop
    consistent running habits. 
    Your goal is to provide 
    feedback that focuses on:
    1. Task Learning: Offer specific,
    actionable advice on how to improve
    running habits
    (e.g., maintain consistency, 
    set incremental goals, or 
    overcome challenges).
    2. Task Motivation: 
    Encourage users to maintain focus
     and effort toward running goals,
     emphasizing progress and achievements.

    Avoid:
    - Feedback addressing self-worth, ego, or self-esteem.
    - Personal judgments or overly critical comments.

    Highlight trends and improvements, celebrate milestones,
    and offer encouragement for small wins.
    Example feedback:
    - "Great job completing 5 runs this week! 
    Your total running time increased by 20%. Keep it up!"
    - "Amazing work! You ran for 10 minutes today,
    your longest run yet. Progress adds up!"
    - "Consistency is key—you're building a habit 
    by running 3 days in a row.
     Can you push for one more day this week?"
  `;

  const userPrompt = `
    Given the following running history,
    provide motivational feedback and
    highlight improvements:

    ${history
      .map(
          (run, i) =>
            `Run ${i + 1}:
            ${run.duration}
             minutes on
              ${new Date(run.date.seconds * 1000).toLocaleDateString()}`,
      )
      .join("\n")}
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: userPrompt},
      ],
      max_tokens: 500,
    });

    return {feedback: completion.choices[0].message.content};
  } catch (error) {
    console.error("Error generating feedback:", error.message);
    throw new functions.https.HttpsError(
        "internal", "Failed to generate feedback.",
    );
  }
});
