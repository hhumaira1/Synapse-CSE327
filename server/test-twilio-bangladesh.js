const apiKeySid = 'SKf686247834a94b425536968b7b657514';        // Your API Key SID
const apiKeySecret = 'oROaTTTyWVpPT1kuWsMEnTyqLz0UXmLu';  // Your API Key Secret
const numberToLookup = '+8801856541646';      // Bangladesh number in E.164
// TWILIO_ACCOUNT_SID="AC1d17c2feabd9d26b85d0ac6ca6941de1"
// TWILIO_AUTH_TOKEN="4bca370965bca93846f883900866fc7f"
// TWILIO_API_KEFY_SID="SKf686247834a94b425536968b7b657514"
// TWILIO_API_KEY_SECRET="oROaTTTyWVpPT1kuWsMEnTyqLz0UXmLu"
// TWILIO_PHONE_NUMBER="+17085547043"
// TWILIO_TWIML_APP_SID="AP9fa0f8f269e1c3e192b2405ba7d784dc"

const accountSid = 'AC1d17c2feabd9d26b85d0ac6ca6941de1'; // Your Twilio Account SID
const authToken = '4bca370965bca93846f883900866fc7f';   // Your Twilio Auth Token
const client = require('twilio')(accountSid, authToken);

const fromNumber = '+17085547043';     // Your Twilio phone number
const toNumber = '+8801856541646';     // Bangladesh phone number

client.calls
  .create({
    url: 'http://demo.twilio.com/docs/voice.xml', // TwiML URL, can be your own webhook URL too
    from: fromNumber,
    to: toNumber
  })
  .then(call => {
    console.log('Call initiated. Call SID:', call.sid);
  })
  .catch(error => {
    console.error('Error placing call:', error);
  });
