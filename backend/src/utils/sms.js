import africastalking from "africastalking";

const credentials = {
  apiKey: process.env.AT_API_KEY,       // your Africa's Talking API key
  username: process.env.AT_USERNAME || "sandbox", // default to sandbox if not set
};

const AT = africastalking(credentials);
const sms = AT.SMS;

/**
 * Send an SMS via Africa's Talking
 * @param {string} to - recipient phone number in international format e.g. +2547XXXXXXX
 * @param {string} message - the SMS body
 */
export const sendSMS = async (to, message) => {
  try {
    const options = {
      to: [to],
      message,
      // from: process.env.AT_SENDER || "AFRICASTKNG" // <- uncomment when you have a custom SenderID approved
    };

    const response = await sms.send(options);

    const { SMSMessageData } = response;
    const { Recipients, Message } = SMSMessageData;

    if (Recipients && Recipients.length > 0) {
      const recipient = Recipients[0];
      console.log(
        `✅ SMS sent successfully | To: ${recipient.number} | Cost: ${recipient.cost} | Status: ${recipient.status}`
      );
      return {
        success: true,
        message: Message,
        recipient,
      };
    } else {
      console.error(`❌ SMS failed: ${Message}`);
      return {
        success: false,
        error: Message,
      };
    }
  } catch (err) {
    console.error("⚠️ Africa's Talking SMS error:", err.message);
    return {
      success: false,
      error: err.message,
    };
  }
};
