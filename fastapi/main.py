#pip install fastapi supabase pyjwt



#UPDATE SCHEDULE ONLY FOR AVAILABLE SLOTS
#INSERT EXPERIENCE COLUMN
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import socketio
import traceback
import os
import jwt
import bcrypt
from datetime import datetime, timedelta,date
from fastapi import FastAPI, HTTPException, Depends,Request,Header,UploadFile,File,Form,Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel,Field
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path
from postgrest.exceptions import APIError
from typing import List,Optional
import smtplib
from agora_token_builder import RtcTokenBuilder
from apscheduler.schedulers.background import BackgroundScheduler
import time
from email.message import EmailMessage
from zoneinfo import ZoneInfo  # For timezone support

# Load environment variables
# BASE_DIR = Path(__file__).resolve().parent.parent
# load_dotenv(BASE_DIR / ".env")

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)



#AGORA
AGORA_APP_ID = os.getenv("AGORA_APP_ID")
AGORA_APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE")

# JWT Constants
SECRET_KEY = "QWERTY!@#$"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

# FastAPI App

scheduler = BackgroundScheduler()
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware import Middleware
from starlette.applications import Starlette
from starlette.routing import Mount
from starlette.responses import JSONResponse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI()

# CORS middleware setup to allow React app on localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://healthcare-o0rt.onrender.com"],  # Frontend React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Socket.IO server
sio = socketio.AsyncServer(cors_allowed_origins=["https://healthcare-o0rt.onrender.com"], async_mode="asgi")
sio_app = socketio.ASGIApp(sio)

# Mount Socket.IO server at /socket.io endpoint
app.mount("/socket.io", sio_app)

@app.get("/")
async def root():
    return {"message": "Hello from FastAPI"}

# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")

@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")

@sio.event
async def send_message(sid, message):
    print(f"Received message: {message}")
    await sio.emit('receive_message', message)



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Password Hashing Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# Function to create JWT token
def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire, "user_id": data.get("id")})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Pydantic Models
class UserSignup(BaseModel):
    name: str
    email: str
    age: int | None = None
    phone: str
    gender: str | None = None
    username: str
    password: str
    experience:int |None =None
    role: str  # "patient" or "specialist"
    specialty: str | None = None  # Only for specialists

class UserLogin(BaseModel):
    username: str
    password: str



#SIGNUP
@app.post("/signup")
async def signup(user: UserSignup):
    # Check if email already exists in patients or specialists
    patient_exists = supabase.table("patients").select("email").eq("email", user.email).execute()
    
    specialist_exists = supabase.table("doctors").select("email").eq("email", user.email).execute()

    if patient_exists.data or specialist_exists.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password
    hashed_password = hash_password(user.password)

    # Insert user into the appropriate table
    if user.role == "patient":
        patient_data = {
            "name": user.name,
            "email": user.email,
            "age": user.age,
            "phone": user.phone,
            "gender": user.gender,
            "username": user.username,
            "password": hashed_password  # Store hashed password
        }
        response=supabase.table("patients").insert(patient_data).execute()
       
    elif user.role == "specialist":
        specialist_data = {
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "username": user.username,
            "password": hashed_password,  # Store hashed password
            "specialization": user.specialty,
            "experience":user.experience,
             "age": user.age,
             "gender": user.gender
            
        }
        response=supabase.table("doctors").insert(specialist_data).execute()
        
    else:
        raise HTTPException(status_code=400, detail="Invalid role")

    return {"message": "Signup successful!"}


#LOGIN
@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    username = form_data.username  # FastAPI OAuth uses 'username' for login
    password = form_data.password

    # Check if user exists in `patients` or `specialists`
    user = None
    role = None
    patient_response = supabase.table("patients").select("*").eq("username", username).execute()
    if patient_response.data:
        user = patient_response.data[0]
        role = "patient"
    specialist_response = supabase.table("doctors").select("*").eq("username", username).execute()

    if specialist_response.data:
        user = specialist_response.data[0]
        role = "specialist"

    
   

    if not user:
        raise HTTPException(status_code=401, detail="Invalid User ID")
    
    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid password")

    # Generate JWT token
    access_token = create_access_token(
        data={"sub": user["username"], "role": role,"id": user["id"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {"access_token": access_token, "token_type": "bearer", "role": role}

class EmailRequest(BaseModel):
    email: str
    
class ResetPasswordRequest(BaseModel):
    email: str
    password: str
    
@app.post("/password-reset-mail")
def generate_mail_fp(request: EmailRequest):
    email = request.email
    try:
        reset_link=f"https://healthcare-o0rt.onrender.com/resetpassword?email={email}"
        body = f"""\
Hi,

You requested a password reset. Click the link below to reset your password:

{reset_link}

If you didn’t request this, you can ignore this email.

Thanks,
Your App Team
"""
        print(f"Connecting to SMTP server...")
        server = smtplib.SMTP('smtp.gmail.com', port=587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)  
        print(f"Sending email to {email}...")
        msg = EmailMessage()
        msg['Subject'] = "Password Reset Link"
        msg['From'] = EMAIL_USER
        msg['To'] = email
        msg.set_content(body)
        server.send_message(msg)
        server.quit()
        print(f"✅ Email successfully sent to {email}")
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        raise
    
@app.put("/reset-password")
def reset_password(request:ResetPasswordRequest):
    password=request.password
    email=request.email
    hashed_password=hash_password(password)
    patient = supabase.table("patients").select("*").eq("email", email).execute()

    if patient.data:
        supabase.table("patients").update({"password": hashed_password}).eq("email", email).execute()
        return {"message": "Password updated successfully."}

    # Try updating in doctors table
    doctor = supabase.table("doctors").select("*").eq("email", email).execute()

    if doctor.data:
        supabase.table("doctors").update({"password": hashed_password}).eq("email", email).execute()
        return {"message": "Password updated successfully."}

    raise HTTPException(status_code=404, detail="Email not found in records")
    


@app.get("/user/me")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        role = payload.get("role")
        # print('-----------------------------------------')
        # print(role)
        # print('-----------------------------------------')
        user_data=None
        if(role=='specialist'):
        # Query the database for the user's ID (doctor's ID if the role is 'specialist')
            user_data = supabase.table("doctors").select("id").eq("username", username).single().execute()
        elif (role=='patient'):
            user_data = supabase.table("patients").select("id").eq("username", username).single().execute()
        if not user_data.data:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = user_data.data["id"]
        
        return {"username": username, "role": role, "id": user_id}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


#FETCH ALL DOCTORS  
@app.get("/doctors")
def get_all_doctors():
    response = supabase.table("doctors").select("*").execute()
    return response.data

# Update the schedule endpoint to handle availability
class ScheduleSlot(BaseModel):
    available_date: str
    start_time: str
    end_time: str
    is_available: bool = True

class AppointmentBooking(BaseModel):
    doctor_id: str
    slot_id: str
    patient_id: str
    
    
# Doctor gets his/her schedule


@app.get("/doctor/{doctor_id}/schedule")
def get_doctor_schedule(doctor_id: str, user=Depends(get_current_user)):
    if user["role"] == "specialist" and user["id"] != doctor_id:
        raise HTTPException(status_code=403, detail="Access denied to this schedule")

    today = date.today().isoformat()

    # Step 1: Fetch schedule_ids from completed appointments
    completed_appts = (
        supabase.table("appointments")
        .select("schedule_id")
        .eq("doctor_id", doctor_id)
        .eq("status", "completed")
        .execute()
    )

    completed_ids = [appt["schedule_id"] for appt in completed_appts.data]

    # Step 2: Fetch doctor_availability where ID not in completed_ids
    query = (
        supabase.table("doctor_availability")
        .select("*")
        .eq("doctor_id", doctor_id)
        .gte("available_date", today)
    )

    if completed_ids:
        query = query.not_.in_("id", completed_ids)

    response = query.execute()

    return response.data

# Endpoint to create a new schedule slot
@app.post("/doctor/{doctor_id}/schedule")
def add_schedule_slot(doctor_id: str, schedule: List[ScheduleSlot], user=Depends(get_current_user)):
    if user["role"] != "specialist" or user["id"] != doctor_id:
        raise HTTPException(status_code=403, detail="Access denied to this schedule")

    # Insert new schedule slots
    schedule_data = [{
        "doctor_id": doctor_id,
        "available_date": slot.available_date,
        "start_time": slot.start_time,
        "end_time": slot.end_time,
        "is_available": True
    } for slot in schedule]

    response = supabase.table("doctor_availability").insert(schedule_data).execute()
    return {"message": "Schedule added", "schedule": response.data}




# Endpoint to update an existing schedule slot
@app.put("/doctor/{doctor_id}/schedule/{slot_id}")
def update_schedule_slot(doctor_id: str, slot_id: str, schedule: ScheduleSlot, user=Depends(get_current_user)):
    if user["role"] != "specialist" or user["id"] != doctor_id:
        raise HTTPException(status_code=403, detail="Access denied to this schedule")

    # Check if the slot exists
    existing_slot = supabase.table("doctor_availability").select("*").eq("id", slot_id).single().execute()
    if not existing_slot.data:
        raise HTTPException(status_code=404, detail="Slot not found")

    # Update the existing schedule slot
    update_data = {
        "available_date": schedule.available_date,
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
        "is_available": schedule.is_available
    }

    response = supabase.table("doctor_availability").update(update_data).eq("id", slot_id).execute()
    return {"message": "Schedule updated", "schedule": response.data}




# Endpoint to delete an existing schedule slot
@app.delete("/doctor/{doctor_id}/schedule/{slot_id}")
def delete_schedule_slot(doctor_id: str, slot_id: str, user=Depends(get_current_user)):
    if user["role"] != "specialist" or user["id"] != doctor_id:
        raise HTTPException(status_code=403, detail="Access denied to this schedule")

    # Check if this slot is used in any appointment
    appointment_check = (
    supabase.table("appointments")
    .select("*")
    .eq("schedule_id", slot_id)
    .eq("status", "upcoming")
    .execute()
)
    if appointment_check.data:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete this slot; it is already booked for an appointment."
        )
        
    
    supabase.table("appointments").delete().eq("schedule_id", slot_id).execute()
    response = supabase.table("doctor_availability").delete().eq("id", slot_id).execute()
    return {"message": "Schedule deleted", "schedule": response.data}

# Endpoint to update an existing schedule slot
@app.put("/doctor/{doctor_id}/schedule/{slot_id}")
def update_schedule_slot(doctor_id: str, slot_id: str, schedule: ScheduleSlot, user=Depends(get_current_user)):
    if user["role"] != "specialist" or user["id"] != doctor_id:
        raise HTTPException(status_code=403, detail="Access denied to this schedule")
    
    existing_slot = supabase.table("doctor_availability").select("*").eq("id", slot_id).single().execute()
    
    if not existing_slot.data:
        raise HTTPException(status_code=404, detail="Schedule slot not found")

    # Step 2: Check if slot is booked
    if str(existing_slot.data.get("is_available")).lower() == "false":  # Or use "status" == "booked"
        raise HTTPException(status_code=400, detail="Cannot update a booked schedule")

    # Update the existing schedule slot
    update_data = {
        "available_date": schedule.available_date,
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
        "is_available": schedule.is_available
    }

    response = supabase.table("doctor_availability").update(update_data).eq("id", slot_id).execute()
    return {"message": "Schedule updated", "schedule": response.data}



# Patients fetch available slots for a doctor
@app.get("/doctor/{doctor_id}/available_slots")
def get_available_slots(doctor_id: str):
    response = supabase.table("doctor_availability").select("*").eq("doctor_id", doctor_id).eq("is_available", True).execute()
    return response.data


@app.post("/book_appointment")
def book_appointment(appointment_data: dict, user=Depends(get_current_user)):
    try:
        # Check if the slot is available
        response = supabase.table("doctor_availability").select("*") \
            .eq("doctor_id", appointment_data["doctor_id"]) \
            .eq("available_date", appointment_data["available_date"]) \
            .eq("start_time", appointment_data["start_time"]) \
            .eq("is_available", True).execute()

        available_slot = response.data
        if not available_slot:
            raise HTTPException(status_code=400, detail="Slot is no longer available.")
        schedule_entry = response.data[0]
        # Debugging: Check the slot data
        # print("Available Slot Data:", available_slot)

        # Insert into appointments table
        new_appointment = {
            "doctor_id": appointment_data["doctor_id"],
            "patient_id": user["id"],  # Use ID from token
            "appointment_date": appointment_data["available_date"],
            "schedule_id": schedule_entry["id"],
            "status": "upcoming",
            "created_at": datetime.utcnow().isoformat()
        }

        # Debugging: Check appointment data before insertion
        # print("New Appointment Data:", new_appointment)

        # Insert appointment
        insert_response = supabase.table("appointments").insert(new_appointment).execute()

        # Debugging: Check insert response
        print("Insert Response:", insert_response)

        # Check if insertion was successful
        if not insert_response.data:
            raise HTTPException(status_code=500, detail="Failed to insert appointment.")

        # Update doctor_availability table
        update_response =  supabase.table("doctor_availability").update({"is_available": False}) \
            .eq("id", schedule_entry["id"]).execute()

        # Debugging: Check update response
        print("Update Response:", update_response)

        # Check if update was successful
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update slot availability.")

        return {"message": "Appointment booked successfully!"}

    except Exception as e:
        print("Error:", str(e))  # Debugging
        raise HTTPException(status_code=500, detail=str(e))





@app.get("/patient/{patient_id}/appointments")
async def get_patient_appointments(patient_id: str, user=Depends(get_current_user)):
    # print("user ID:", user["id"])
    # print("patient_id", patient_id)

    if user["id"] != patient_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    response = (
        supabase.from_("appointments")
        .select("id,appointment_date, status, patients(name), doctors(name), doctor_availability(start_time, end_time),doctor_id,patient_id,schedule_id")
        .eq("patient_id", patient_id)
        .execute()
    )

    data = response.data
    if not data:
        return "No appointments found"
    
    return [
        {
            "id":appt["id"],
            "patient_name": appt["patients"]["name"],
            "doctor_name": appt["doctors"]["name"],
            "appointment_date": appt["appointment_date"],
            "start_time": appt["doctor_availability"]["start_time"],
            "end_time": appt["doctor_availability"]["end_time"],
            "status": appt["status"],
            "doctor_id": appt["doctor_id"],   # Added doctor_id
            "patient_id": appt["patient_id"], # Added patient_id
            "schedule_id":appt["schedule_id"]
        }
        for appt in data
    ]


# Request model for rescheduling
class RescheduleRequest(BaseModel):
    schedule_id: str  # New schedule slot ID

@app.put("/appointments/cancel/{appointment_id}")
def cancel_appointment(appointment_id: str, user: str = Depends(get_current_user)):
    # print('----------------------------------')
    # print("Appointment_Id:",appointment_id)
    response = supabase.table("appointments").select("*").eq("id", appointment_id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment = response.data
    if appointment["patient_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Mark appointment as cancelled
    supabase.table("appointments").update({"status": "cancelled"}).eq("id", appointment["id"]).execute()

    # Make the doctor's schedule available again
    supabase.table("doctor_availability").update({"is_available": True}).eq("id", appointment["schedule_id"]).execute()

    return {"message": "Appointment cancelled successfully"}





@app.put("/appointments/reschedule/{appointment_id}")
def reschedule_appointment(appointment_id: str, request: RescheduleRequest, user: str = Depends(get_current_user)):
    
    response = supabase.table("appointments").select("*").eq("schedule_id", appointment_id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment = response.data
    if appointment["patient_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Free the old schedule slot
    supabase.table("doctor_availability").update({"is_available": True}).eq("id", appointment["schedule_id"]).execute()

    # Assign new schedule slot
    supabase.table("appointments").update({"schedule_id": request.schedule_id}).eq("schedule_id", appointment_id).execute()

    # Mark new slot as unavailable
    supabase.table("doctor_availability").update({"is_available": False}).eq("id", request.schedule_id).execute()

    return {"message": "Appointment rescheduled successfully"}



#patient details from slot

@app.get("/{doctor_id}/slot/{slot_id}/patient")
def get_patient_details_from_slot(slot_id: str, doctor_id:str,user=Depends(get_current_user)):
    # Only specialists can view patient details from a slot
    if user["role"] != "specialist" and user["id"]!=doctor_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # print("SLOT IDDDD:",slot_id)
    # print("DOCTOR IDD",doctor_id)
    # Get the appointment for this slot
    appointment = supabase.table("appointments").select("patient_id").eq("schedule_id", slot_id).execute()
    if not appointment.data:
        raise HTTPException(status_code=404, detail="No appointment found for this slot")

    patient_id = appointment.data[0]["patient_id"]

    # Get patient details
    patient = supabase.table("patients").select("name", "age", "email","gender").eq("id", patient_id).single().execute()
    if not patient.data:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patient.data




#MEDICAL RECORDS

# @app.post("/upload_record/{user_id}")
# async def upload_medical_record(
#     user_id: str,
#     file: UploadFile = File(...),
#     current_user = Depends(get_current_user)
# ):
#     # Verify user has permission
#     if user_id != current_user["id"]:
#         raise HTTPException(status_code=403, detail="Forbidden")

#     # Validate file
#     if not file:
#         raise HTTPException(status_code=400, detail="No file uploaded")

#     # Validate file type
#     allowed_types = [
#         "application/pdf",
#         "image/jpeg",
#         "image/png",
#         "text/plain"
#     ]
#     if file.content_type not in allowed_types:
#         raise HTTPException(status_code=400, detail="File type not allowed")

#     try:
#         contents = await file.read()
        
#         # Generate safe filename
#         file_ext = os.path.splitext(file.filename)[1]
#         if not file_ext:
#             file_ext = ".bin"  # default extension if none found
        
#         timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
#         safe_filename = f"{timestamp}{file_ext}"
#         path = f"records/{user_id}/{safe_filename}"

#         # Upload to storage
#         bucket_name = "medical-records"
#         storage_client = supabase.storage.from_(bucket_name)
        
#         upload_result = storage_client.upload(
#             path=path,
#             file=contents,
#             file_options={"content-type": file.content_type}
#         )

#         if upload_result.get("error"):
#             raise HTTPException(status_code=500, detail="File upload failed")

#         # Insert record into database
#         db_result = supabase.table("medical_certificates").insert({
#             "user_id": user_id,
#             "file_path": path,
#             "file_name": file.filename,
#             "file_type": file.content_type,
#             "file_size": len(contents)
#         }).execute()

#         if db_result.error:
#             raise HTTPException(status_code=500, detail="Database operation failed")

#         return {
#             "message": "Uploaded successfully",
#             "file_path": path,
#             "file_name": file.filename
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
@app.post("/upload_record/{user_id}")
async def upload_medical_record(
    user_id: str,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    if user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        contents = await file.read()
        file_ext = os.path.splitext(file.filename)[1] or ".bin"
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        safe_filename = f"{timestamp}{file_ext}"
        path = f"records/{user_id}/{safe_filename}"

        bucket_name = "medical-records"
        upload_result = supabase.storage.from_(bucket_name).upload(
            path=path,
            file=contents,
            file_options={"content-type": file.content_type}
        )

        # Check if the upload was successful
        if upload_result is None:
            raise HTTPException(status_code=500, detail="File upload failed")

        # Optional: store metadata in your own table
        supabase.table("medical_certificates").insert({
            "user_id": user_id,
            "file_path": path,
            "file_name": file.filename,
            "file_type": file.content_type,
            "file_size": len(contents)
        }).execute()

        # Construct the public URL for the uploaded file
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{path}"

        return {
            "message": "Uploaded successfully",
            "file_path": path,
            "file_name": file.filename,
            "public_url": public_url
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/records/")
def get_medical_records(user=Depends(get_current_user)):
    user_id = user["id"]
    # print(user["id"])
    result = supabase.table("medical_certificates").select("*").eq("user_id", user_id).order("uploaded_at", desc=True).execute()
    data = result.data

    for record in data:
        signed_url = supabase.storage.from_("medical-records").create_signed_url(record["file_path"], 3600)
        # print(signed_url)
        record["url"] = signed_url.get("signedURL", "")

    return {"records": data}


@app.get("/records/{id}")
def get_medical_records(id:str):
    user_id = id
    result = supabase.table("medical_certificates").select("*").eq("user_id", user_id).order("uploaded_at", desc=True).execute()
    data = result.data

    for record in data:
        signed_url = supabase.storage.from_("medical-records").create_signed_url(record["file_path"], 3600)
        # print(signed_url)
        record["url"] = signed_url.get("signedURL", "")

    return {"records": data}




def check_and_send_emails():
    print('-----------------------Running scheduler-------------------')

    IST = ZoneInfo("Asia/Kolkata")  # or your local timezone

    now = datetime.now(IST)

    response = supabase.table("appointments").select("*").eq("status", "upcoming").execute()
    appointments = response.data

    for appointment in appointments:
        appointment_date = appointment['appointment_date']  # "2025-05-03"
        schedule_id = appointment['schedule_id']

        schedule_response = supabase.table("doctor_availability").select("*").eq("id", schedule_id).execute()
        if not schedule_response.data:
            # print(f"No schedule found for appointment {appointment['id']}")
            continue

        schedule = schedule_response.data[0]

        start_time = schedule['start_time']  # e.g., "12:16:00"

        # Combine date and time, and localize
        try:
            appointment_time = datetime.strptime(f"{appointment_date} {start_time}", "%Y-%m-%d %H:%M:%S")
        except ValueError:
            appointment_time = datetime.strptime(f"{appointment_date} {start_time}", "%Y-%m-%d %H:%M")

        appointment_time = appointment_time.replace(tzinfo=IST)

        reminder_time = appointment_time - timedelta(minutes=30)
        seconds_until_reminder = (reminder_time - now).total_seconds()

        # print(f"Seconds until reminder: {seconds_until_reminder}")

        if 0 <= seconds_until_reminder <= 60:
            # print(f"Sending reminder for appointment {appointment['id']} at {appointment_time}")
            generate_mail(appointment['id'])
        else:
            pass
            # print(f"Skipping appointment {appointment['id']}, not in reminder window.")





# Run this every 1 minute
scheduler.add_job(check_and_send_emails, 'interval', minutes=1)
scheduler.start()

def generate_mail(appointment_id: int):
    try:
        # Fetch appointment details from Supabase
        print("Inside generate_mail")
        appointment_resp = supabase.table("appointments").select("*").eq("id", appointment_id).single().execute()
        appointment=appointment_resp.data
        if not appointment:
            raise ValueError("Appointment not found")
        
        patient_id = appointment['patient_id']
        doctor_id = appointment['doctor_id']
        appointment_datetime = appointment['appointment_date']
        schedule_id = appointment['schedule_id']
        
        # Fetch patient details
        patient_resp = supabase.table("patients").select("*").eq("id", patient_id).single().execute()
        patient=patient_resp.data
        if not patient:
            raise ValueError("Patient not found")
        
        # Fetch doctor details
        doctor_resp = supabase.table("doctors").select("*").eq("id", doctor_id).single().execute()
        doctor=doctor_resp.data
        if not doctor:
            raise ValueError("Doctor not found")
        
        # Fetch doctor's availability details
        schedule_resp = supabase.table("doctor_availability").select("*").eq("id", schedule_id).single().execute()
        schedule=schedule_resp.data
        if not schedule:
            raise ValueError("Doctor's schedule not found")

        # Prepare dynamic values
        doctor_name = doctor['name']
        doctor_mail = doctor['email']
        patient_name = patient['name']
        patient_mail = patient['email']
        channel_name = f"consultation_{appointment_id}"

        # Sending email
        subject = "Upcoming Consultation with Doctor"
        
        # Email content for the patient
        patient_body = f"""
        Dear {patient_name},

        This is a reminder for your upcoming consultation with Dr. {doctor_name}.

        Details:
        - Appointment Time: {appointment_datetime}
        - Consultation Channel: {channel_name}

        Please click the link below to join the consultation at the scheduled time:
        Join Consultation: https://healthcare-o0rt.onrender.com/consultation/{channel_name}

        Thank you,
        Healthcare Platform Team
        """
        
        # Send email to patient
        print(f"Sending email to patient: {patient_mail}")
        send_email(patient_mail, subject, patient_body)
        
        # Email content for the doctor
        doctor_body = f"""
        Dear Dr. {doctor_name},

        This is a reminder for your upcoming consultation with {patient_name}.

        Details:
        - Appointment Time: {appointment_datetime}
        - Consultation Channel: {channel_name}

        Please click the link below to join the consultation at the scheduled time:
        Join Consultation: https://healthcare-o0rt.onrender.com/consultation/{channel_name}

        Thank you,
        Healthcare Platform Team
        """
        
        # Send email to doctor
        
        print(f"Sending email to doctor: {doctor_mail}")
        send_email(doctor_mail, subject, doctor_body)

        return {"message": "Emails sent successfully to both doctor and patient."}
    
   

    except Exception as e:
        traceback.print_exc()
        return {"error": f"An error occurred while sending the email: {str(e)}"}

# Helper function to send email
def send_email(to_email, subject, body):
    try:
        print(f"Connecting to SMTP server...")
        server = smtplib.SMTP('smtp.gmail.com', port=587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS) 
        print(f"Sending email to {to_email}...")
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = EMAIL_USER
        msg['To'] = to_email
        msg.set_content(body)
        server.send_message(msg)
        server.quit()
        print(f"✅ Email successfully sent to {to_email}")
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        raise

    


class ConsultationPayload(BaseModel):
    appointment_id: str
    patient_id: str
    doctor_id: str
    duration: int
    summary: str


@app.post("/consultation/complete")
def complete_consultation(payload: ConsultationPayload, user=Depends(get_current_user)):
    # print("User ID:", user["id"])
    # print("Payload Doctor ID:", payload.doctor_id)
    # print("Payload Patient ID:", payload.patient_id)

    # Fixed authentication logic - user must be either the doctor or the patient
    if user["id"] != payload.patient_id and user["id"] != payload.doctor_id:
        raise HTTPException(status_code=403, detail="Not authenticated")
    
    # print('---------------')
    # print("PAYLOAD>APPOINTMENT_ID", payload.appointment_id)
    # print('---------------')
    
    # Insert into consultation table
    try:
        insert_response = supabase.table("consultations").insert({
            "appointment_id": payload.appointment_id,
            "patient_id": payload.patient_id,
            "doctor_id": payload.doctor_id,
            "duration": payload.duration,
            "summary": payload.summary
        }).execute()

        # Check if there's an error in the response
        if hasattr(insert_response, 'error') and insert_response.error:
            print("Insert error:", insert_response.error)
            raise HTTPException(status_code=500, detail=f"Failed to insert consultation data: {insert_response.error}")
        
        print("Consultation inserted successfully")
        
        # Update appointment status to "completed"
        update_response = supabase.table("appointments").update({
            "status": "completed"
        }).eq("id", payload.appointment_id).execute()

        # Check if there's an error in the response
        if hasattr(update_response, 'error') and update_response.error:
            print("Update error:", update_response.error)
            raise HTTPException(status_code=500, detail=f"Failed to update appointment status: {update_response.error}")
        
        print("Appointment status updated successfully")
        return {"message": "Consultation completed and appointment updated."}
    except Exception as e:
        print("Exception:", str(e))
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.get("/appointments/{appointment_id}")
def get_appointment(appointment_id: str):
    if appointment_id.startswith("consultation_"):
        appointment_id = appointment_id.replace("consultation_", "")
    
    response = (
        supabase.from_("appointments")
        .select("id,appointment_date,status,patients(name),doctors(name),doctor_availability(start_time,end_time),doctor_id,patient_id,schedule_id")
        .eq("id", appointment_id)
        .execute()
    )

    data = response.data
    # print("DATA IN CONSULTATION:",data)
    if not data:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt = data[0]
    return {
        "id": appt["id"],
        "patient_name": appt["patients"]["name"],
        "doctor_name": appt["doctors"]["name"],
        "appointment_date": appt["appointment_date"],
        "start_time": appt["doctor_availability"]["start_time"],
        "end_time": appt["doctor_availability"]["end_time"],
        "status": appt["status"],
        "doctor_id": appt["doctor_id"],
        "patient_id": appt["patient_id"],
        "schedule_id": appt["schedule_id"]
    }



@app.get("/consultation/token")
def get_agora_token(appointment_id: str=Query(...), uid: int = Query(...)):
    try:
        # 1. Construct the channel name dynamically
        channel_name = f"consultation_{appointment_id}"

        # 2. Define token privileges
        role = 1  # 1 = publisher (can speak)
        expire_time_seconds = 3600  # Token valid for 1 hour
        current_timestamp = int(time.time())
        privilege_expired_ts = current_timestamp + expire_time_seconds

        # 3. Build the token
        token = RtcTokenBuilder.buildTokenWithUid(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channel_name,
            uid,
            role,
            privilege_expired_ts
        )

        return {
            "token": token,
            "channel_name": channel_name,
            "uid": uid,
            "expires_in": expire_time_seconds
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating token: {str(e)}")


@app.get("/profile")
def get_user_profile(user=Depends(get_current_user)):
    user_id = user["id"]
    role = user["role"]

    # Fetch the profile data based on the user role (e.g., 'patient' or 'specialist')
    if role == 'patient':
        response = supabase.table('patients').select("*").eq("id", user_id).single().execute()
    else:
        response = supabase.table('doctors').select("*").eq("id", user_id).single().execute()

    # Ensure the response has data (handle the case if no record is found)
    if not response:
        raise HTTPException(status_code=404, detail="User not found")

    # Extract the data directly from the response (no need for .data)
    data = response.data
    # print("DATA: ",data)
    # Manually serialize the data to a format that FastAPI can encode
    profile = {
        "id": data["id"],
        "name": data["name"],
        "email": data["email"],
        "age": data.get("age"),
        "phone": data["phone"],
        "gender": data.get("gender"),
        "username": data["username"],
        "experience": data.get("experience"),
        "role": data["role"],
        "specialty": data.get("specialization"),  # Only for specialists
        "about":data.get("about")
    }
    
    return profile

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    username: Optional[str] = None
    experience: Optional[int] = None
    specialization: Optional[str] = None  # only for specialists
    about:Optional[str]=None
    
@app.put("/profile")
def update_user_profile(
    payload: UpdateProfileRequest,
    user=Depends(get_current_user)
):
    user_id = user["id"]
    role = user["role"]

    table_name = "patients" if role == "patient" else "doctors"

    update_data = payload.dict(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    response = (
        supabase
        .table(table_name)
        .update(update_data)
        .eq("id", user_id)
        .execute()
    )

    if response.data:
        return {"message": "Profile updated successfully", "data": response.data[0]}
    
    raise HTTPException(status_code=500, detail="Failed to update profile")


class FeedbackRequest(BaseModel):
    stars: int = Field(..., ge=1, le=5)
    feedback: str
    
@app.post("/feedback-post")
def submit_feedback(feedback: FeedbackRequest):
    try:
        response = supabase.table("feedback").insert({
            "stars": feedback.stars,
            "feedback": feedback.feedback,
        }).execute()

        if not response:
            raise HTTPException(status_code=500, detail="Failed to submit feedback")

        return {"message": "Feedback submitted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))