# PLACE AT: app/utils/email_sender.py  (REPLACES your existing file)

import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SENDER_EMAIL = os.getenv("EMAIL_SENDER")
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def _send_email(receiver_email: str, subject: str, body: str) -> bool:
    """Shared low-level sender used by all the email helpers below."""
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"Digital Faculty Assistant <{SENDER_EMAIL}>"
    msg["To"] = receiver_email
    msg.set_content(body)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(SENDER_EMAIL, SENDER_PASSWORD)
            smtp.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def send_otp_email(receiver_email: str, otp_code: str) -> bool:
    """Existing OTP email — unchanged behavior."""
    body = f"""\
Hello,

Your verification code for the Digital Faculty Assistant is: {otp_code}

This code will expire in 10 minutes. If you did not request this code, please ignore this email.

Best,
The System Administrator
"""
    return _send_email(receiver_email, "Your Digital Faculty Assistant OTP Code", body)


def send_admin_notification_email(admin_email: str, request_id: int, teacher_name: str, teacher_email: str) -> bool:
    """
    NEW: Notifies the admin that a teacher has requested account access.
    Contains a direct link into the Admin Panel's request review screen.
    """
    review_link = f"{FRONTEND_URL}/admin/requests/{request_id}"
    body = f"""\
Hello Admin,

A new teacher access request has been submitted on Digital Faculty Assistant.

    Name:  {teacher_name}
    Email: {teacher_email}

Review and approve/reject this request here:
{review_link}

Best,
Digital Faculty Assistant System
"""
    return _send_email(admin_email, "New Teacher Access Request — DFA", body)


def send_teacher_setup_email(teacher_email: str, setup_token: str) -> bool:
    """
    NEW: Sent after admin approves a teacher request (or during admin bootstrap).
    Gives the teacher a one-time link to set their own password.
    """
    setup_link = f"{FRONTEND_URL}/set-password?token={setup_token}"
    body = f"""\
Hello,

Your Digital Faculty Assistant teacher account has been approved!

Click the link below to set your password and activate your account.
This link is valid for 24 hours.

{setup_link}

Best,
The System Administrator
"""
    return _send_email(teacher_email, "Your DFA Teacher Account Is Approved", body)


def send_admin_status_email(teacher_email: str, teacher_name: str, promoted: bool) -> bool:
    """
    NEW: Notifies a teacher when their admin status changes (promoted or demoted).
    """
    if promoted:
        subject = "You've Been Made an Admin — DFA"
        body = f"""\
Hello {teacher_name},

You have been granted Admin access on the Digital Faculty Assistant platform.

You can now log in with your existing credentials to review teacher access
requests and manage teacher accounts from the Admin Panel:
{FRONTEND_URL}/admin

Best,
Digital Faculty Assistant System
"""
    else:
        subject = "Your Admin Access Has Been Removed — DFA"
        body = f"""\
Hello {teacher_name},

Your Admin access on the Digital Faculty Assistant platform has been removed.
You can still log in and use your regular Teacher account as usual.

Best,
Digital Faculty Assistant System
"""
    return _send_email(teacher_email, subject, body)