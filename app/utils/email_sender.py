import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SENDER_EMAIL = os.getenv("EMAIL_SENDER")
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD")


def send_otp_email(receiver_email: str, otp_code: str):
    """
    Constructs and sends an OTP email using Gmail's SMTP server.
    """
    # 1. Construct the email message
    msg = EmailMessage()
    msg["Subject"] = "Your Digital Faculty Assistant OTP Code"
    msg["From"] = f"Digital Faculty Assistant <{SENDER_EMAIL}>"
    msg["To"] = receiver_email

    # 2. Write the body of the email
    msg.set_content(f"""\
Hello,

Your verification code for the Digital Faculty Assistant is: {otp_code}

This code will expire in 10 minutes. If you did not request this code, please ignore this email.

Best,
The System Administrator
""")

    # 3. Connect to the server and send it safely
    try:
        # We use SMTP_SSL for a secure, encrypted connection on port 465
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(SENDER_EMAIL, SENDER_PASSWORD)
            smtp.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
