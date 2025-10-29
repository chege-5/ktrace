import africastalking from "africastalking";
import dotenv from "dotenv";

dotenv.config();

const at = africastalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME,
});

const sms = at.SMS;

sms.send({
  to: ["+254742195920"],   // one of your sandbox test numbers
  message: "your kahawa thng is working perfectlyfine all i want you to know  is that you are are a good dev, and for that reasion submit the codees required to the leader",
})
.then(res => console.log("✅ Sent:", JSON.stringify(res, null, 2)))
.catch(err => console.error("❌ Error:", err));
