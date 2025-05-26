A Healthcare platform designed for chronic patients.It provides access to appointment booking, medical records and telemedicine consultations.

Tech Stack:
Frontend:React
Backend:FastAPI
Database:Supabase
+ Agora for telemedicine support.

Features:
Patients:
  Schedule,Reschedule and cancel appointments.
  Easy access to medical records.
  
Healthcare Providers:
  Creating and managing schedule.
  Access patient health records.

  
Common:
  Consultation reminder.
  Profile Management.  
  Automated email notifications sent 30 minutes before appointments.

  
Telemedicine Integration:
  Built-in video/audio consultations using Agora SDK.
  Real-time chat during calls.
  Notes section.
  Easy access to patient records for doctors during consultation.

Create a .env file in the root of the React project:
VITE_API_URL=your_backend_url (or local host)
VITE_AGORA_APP_ID=agora_id

Create a .env file in the root of the fastapi project:
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
EMAIL_USER=email_id
EMAIL_PASS=email_app_password
AGORA_APP_ID=your_agora_app_ID
AGORA_APP_CERTIFICATE=ypur_agora_app_certificate

USAGE:
import os
from dotenv import load_dotenv
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")

Install requirements.txt

DEPLOYED LINK:
https://healthcare-o0rt.onrender.com
