accountSid = 'AC1d17c2feabd9d26b85d0ac6ca6941de1'; 
authToken = '4bca370965bca93846f883900866fc7f';
client = Client(accountSid, authToken)

# Your Twilio number (must be a verified Twilio number)
from_number = '+17085547043'  # Replace with your Twilio number

# Destination Bangladesh number in E.164 format (must be verified if on trial)
to_number = '+8801856541646'  # Replace with the Bangladesh number you want to call

try:
    call = client.calls.create(
        to=to_number,
        from_=from_number,
        url='http://demo.twilio.com/docs/voice.xml'  # TwiML instructions URL
    )
    print(f'Call initiated successfully. Call SID: {call.sid}')
except Exception as e:
    print(f'Error during call: {e}')