from app.models.department import Department
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.request import Request
from app.models.appointment import Appointment
from app.models.message import Message
from app.models.cr_message import CRMessage
from app.models.otp import OTPCode
from app.models.teacher_request import TeacherAccessRequest

__all__ = [
    "Department",
    "Student",
    "Teacher",
    "Request",
    "Appointment",
    "Message",
    "CRMessage",
    "OTPCode",
    "TeacherAccessRequest",
]
