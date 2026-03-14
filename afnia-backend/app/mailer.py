import os
from dotenv import load_dotenv
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

load_dotenv()



def send_admin_application_email(
    *,
    to_email: str,
    applicant_email: str,
    institution: str,
    country: str,
    message: str,
    approve_link: str,
    reject_link: str,
) -> None:
    api_key = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("FROM_EMAIL")

    if not api_key or not from_email:
        raise RuntimeError("SendGrid not configured (SENDGRID_API_KEY/FROM_EMAIL missing)")

    subject = f"[AfNIA] New contributor application: {applicant_email}"
    text = f"""New AfNIA contributor application

Applicant: {applicant_email}
Institution: {institution}
Country: {country}

Message:
{message}

Approve:
{approve_link}

Reject:
{reject_link}
"""

    sg = SendGridAPIClient(api_key)
    mail = Mail(from_email=from_email, to_emails=to_email, subject=subject, plain_text_content=text)
    sg.send(mail)
