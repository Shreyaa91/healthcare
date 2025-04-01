#pip install fastapi supabase pyjwt


import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends,Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path
from postgrest.exceptions import APIError
from typing import List

# Load environment variables
# BASE_DIR = Path(__file__).resolve().parent.parent
# load_dotenv(BASE_DIR / ".env")
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
print(SUPABASE_KEY)


# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Constants
SECRET_KEY = "QWERTY!@#$"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# FastAPI App
app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:5173"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
     allow_origins=["*"]
)


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
    to_encode.update({"exp": expire})
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
        supabase.table("patients").insert(patient_data).execute()

    elif user.role == "specialist":
        specialist_data = {
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "username": user.username,
            "password": hashed_password,  # Store hashed password
            "specialization": user.specialty
        }
        supabase.table("doctors").insert(specialist_data).execute()

    else:
        raise HTTPException(status_code=400, detail="Invalid role")

    return {"message": "Signup successful!"}


#LOGIN
@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    username = form_data.username  # FastAPI OAuth uses 'username' for login
    password = form_data.password

    # Check if user exists in `patients` or `specialists`
    patient_response = supabase.table("patients").select("*").eq("username", username).execute()
    specialist_response = supabase.table("doctors").select("*").eq("username", username).execute()

    user = None
    role = None

    if patient_response.data:
        user = patient_response.data[0]
        role = "patient"
    elif specialist_response.data:
        user = specialist_response.data[0]
        role = "specialist"

    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate JWT token
    access_token = create_access_token(
        data={"sub": user["username"], "role": role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {"access_token": access_token, "token_type": "bearer", "role": role}


# Middleware to get the current user
# def get_current_user(token: str):
#     user_response = supabase.auth.get_user(token)
#     if not user_response or not user_response.get("id"):
#         raise HTTPException(status_code=401, detail="Invalid token")
#     return user_response


#USER AUTHENTICATION
@app.get("/user/me")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        role = payload.get("role")

        return {"username": username, "role": role}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
# @app.get("/user/me")
# def get_user_me(request: Request):
#     auth_header = request.headers.get("Authorization")
#     if not auth_header or not auth_header.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Invalid or missing token")

#     token = auth_header.split(" ")[1]
#     user = get_current_user(token)  # Your function to decode token
#     return {"id": user["id"], "role": user["role"], "username": user["username"]}
    
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


# Add authentication to schedule endpoints
@app.get("/doctor/{doctor_id}/schedule")
def get_doctor_schedule(doctor_id: str, token: str = Depends(oauth2_scheme)):
    # Anyone can view a doctor's schedule
    response = (
        supabase.table("doctor_availability")
        .select("*")
        .eq("doctor_id", doctor_id)
        .execute()
    )
    return response.data

@app.post("/doctor/{doctor_id}/schedule")
def add_or_update_schedule(
    doctor_id: str, 
    schedule: List[ScheduleSlot],
    token: str = Depends(oauth2_scheme)
):
    # Verify the logged-in user is the doctor
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        current_user = get_user_by_username(payload.get("sub"))
        
        if str(current_user["id"]) != doctor_id:
            raise HTTPException(status_code=403, detail="Can only update your own schedule")
        
        # Remove old schedule
        supabase.table("doctor_availability").delete().eq("doctor_id", doctor_id).execute()
        
        # Prepare and insert new schedule
        schedule_data = [{
            "doctor_id": doctor_id,
            "available_date": slot.available_date,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "is_available": slot.is_available
        } for slot in schedule]
        
        response = supabase.table("doctor_availability").insert(schedule_data).execute()
        return {"message": "Schedule updated", "schedule": response.data}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Helper function to get user by username
def get_user_by_username(username: str):
    patient = supabase.table("patients").select("*").eq("username", username).execute()
    if patient.data:
        return patient.data[0]
    doctor = supabase.table("doctors").select("*").eq("username", username).execute()
    if doctor.data:
        return doctor.data[0]
    return None

#WORKS FOR DOCTORSCHEDULE AND DOCTORSLIST
'''@app.get("/doctor/{doctor_id}/schedule")
def get_doctor_schedule(doctor_id: str):
    response = (
        supabase.table("doctor_availability")
        .select("*")
        .eq("doctor_id", doctor_id)
        .execute()
    )
    return response.data
@app.post("/doctor/{doctor_id}/schedule")
def add_or_update_schedule(doctor_id: str, schedule: List[ScheduleSlot]):
    # Remove old schedule
    supabase.table("doctor_availability").delete().eq("doctor_id", doctor_id).execute()
    
    # Prepare data for insertion
    schedule_data = []
    for slot in schedule:
        slot_data = {
            "doctor_id": doctor_id,
            "available_date": slot.available_date,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "is_available": slot.is_available
        }
        schedule_data.append(slot_data)
    
    # Insert new schedule
    response = supabase.table("doctor_availability").insert(schedule_data).execute()
    return {"message": "Schedule updated", "schedule": response.data}

# Specialist (Doctor) Views Appointments
@app.get("/doctor/{doctor_id}/appointments")
def get_doctor_appointments(doctor_id: str):
    response = (
        supabase.table("appointments")
        .select("patient_id, appointment_date, start_time")
        .eq("doctor_id", doctor_id)
        .execute()
    )
    
    if not response.data:
        return []
    
    # Fetch patient names
    patient_ids = [appt["patient_id"] for appt in response.data]
    patients = (
        supabase.table("patients")
        .select("id, name")
        .in_("id", patient_ids)
        .execute()
    )

    patient_map = {p["id"]: p["name"] for p in patients.data}
    
    for appt in response.data:
        appt["patient_name"] = patient_map.get(appt["patient_id"], "Unknown")

    return response.data'''



































































































































#Specialist Adds or Updates Schedule (7 Days)
# @app.post("/doctor/{doctor_id}/schedule")
# def add_or_update_schedule(doctor_id: str, schedule: List[dict]):
#     # Remove old schedule
#     supabase.table("doctor_availability").delete().eq("doctor_id", doctor_id).execute()
    
#     # Insert new schedule
#     for slot in schedule:
#         slot["doctor_id"] = doctor_id
    
#     response = supabase.table("doctor_availability").insert(schedule).execute()
#     return {"message": "Schedule updated", "schedule": schedule}

# #Get Doctor's Schedule (for Patients)
# @app.get("/doctor/{doctor_id}/schedule")
# def get_doctor_schedule(doctor_id: str):
#     response = (
#         supabase.table("doctor_availability")
#         .select("*")
#         .eq("doctor_id", doctor_id)
#         .execute()
#     )
#     return response.data


# #Doctor Adds Available Time Slots
# @app.post("/doctor/{doctor_id}/availability")
# def add_availability(doctor_id: str, available_date: str, start_time: str, end_time: str):
#     today = datetime.utcnow().date()
#     max_date = today + timedelta(days=7)
#     available_date_obj = datetime.strptime(available_date, "%Y-%m-%d").date()

#     if available_date_obj < today or available_date_obj > max_date:
#         raise HTTPException(status_code=400, detail="Availability must be within the next 7 days.")

#     # Split time into 30-min slots
#     start = datetime.strptime(start_time, "%H:%M")
#     end = datetime.strptime(end_time, "%H:%M")

#     time_slots = []
#     while start < end:
#         slot_end = start + timedelta(minutes=30)
#         time_slots.append({
#             "doctor_id": doctor_id,
#             "available_date": available_date,
#             "start_time": start.strftime("%H:%M"),
#             "end_time": slot_end.strftime("%H:%M")
#         })
#         start = slot_end

#     response = supabase.table("doctor_availability").insert(time_slots).execute()
#     return {"message": "Availability added", "slots": time_slots}

# #GET AVAILABLE SLOTS
# @app.get("/doctor/{doctor_id}/availability")
# def get_availability(doctor_id: str):
#     response = (
#         supabase.table("doctor_availability")
#         .select("*")
#         .eq("doctor_id", doctor_id)
#         .execute()
#     )
#     return response.data

# #BOOK APPOINTMENT
# @app.post("/appointments/book")
# def book_appointment(patient_id: str, doctor_id: str, appointment_date: str, start_time: str):
#     appointment_time = datetime.strptime(appointment_date, "%Y-%m-%d").date()

#     # Check if slot exists
#     available_slot = (
#         supabase.table("doctor_availability")
#         .select("*")
#         .eq("doctor_id", doctor_id)
#         .eq("available_date", appointment_time.isoformat())
#         .eq("start_time", start_time)
#         .execute()
#     )

#     if not available_slot.data:
#         raise HTTPException(status_code=400, detail="Time slot unavailable.")

#     # Insert appointment
#     new_appointment = {
#         "patient_id": patient_id,
#         "doctor_id": doctor_id,
#         "appointment_date": appointment_date,
#         "start_time": start_time,
#         "status": "pending"
#     }
#     response = supabase.table("appointments").insert(new_appointment).execute()

#     # Remove only booked slot
#     supabase.table("doctor_availability").delete().eq("doctor_id", doctor_id).eq("available_date", appointment_time.isoformat()).eq("start_time", start_time).execute()

#     return response

# @app.get("/specialist/appointments")
# async def get_specialist_appointments(current_user: User = Depends(get_current_user)):
#     if current_user.role != "specialist":
#         raise HTTPException(status_code=403, detail="Unauthorized")
#     appointments = await get_appointments_for_specialist(current_user.id)
#     return appointments

# @app.get("/appointments/{username}")
# async def get_patient_appointments(username: str):
#     response = supabase.table("appointments").select("*").eq("patient_username", username).execute()
#     return response.data
   
    
# @app.get("/doctor/appointments/{doctor_name}")
# async def get_doctor_appointments(doctor_name: str):
#     response = supabase.table("appointments").select("*").eq("doctor", doctor_name).execute()
#     return response.data

    
# @app.get("/doctors/search")
# async def search_doctors(query: str):
#     try:
#         response = supabase.rpc("search_doctors_by_name", {"name_query": "priya"}).execute()
#         print(response.data)

#         return response
#     except APIError as e:
#         return {"error": str(e)}

    
# @app.post("/doctor/schedule/update")
# async def update_schedule(doctor_name: str, available_dates: list):
#     response = supabase.table("doctors").update({"schedule": available_dates}).eq("name", doctor_name).execute()
#     return {"message": "Schedule updated"}
   
    
    
    
    
    
    
    
    
    
    
    
    # User Model (SQLAlchemy)
# class User(Base):
#     __tablename__ = "users"
#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, nullable=False)
#     email = Column(String, unique=True, nullable=False)
#     age = Column(Integer, nullable=False)
#     gender = Column(String, nullable=False)
#     username = Column(String, unique=True, nullable=False)
#     password = Column(String, nullable=False)  # Hashed password

# # Pydantic Schemas
# class UserSignup(BaseModel):
#     name: str
#     email: str
#     age: int 
#     phone: str
#     gender: str 
#     username: str
#     password: str
#     role: str
#     specialty: str | None = None  # Only for specialists

# class UserLogin(BaseModel):
#     username: str
#     password: str

# # Create Tables
# Base.metadata.create_all(bind=engine)

# # Utility Functions
# def create_access_token(data: dict, expires_delta: timedelta):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + expires_delta
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# def verify_password(plain_password, hashed_password):
#     return pwd_context.verify(plain_password, hashed_password)

# def get_password_hash(password):
#     return pwd_context.hash(password)

# # API Endpoints
# @app.post("/signup")

# def signup(user: UserSignup):
#     # Step 1: Create user in Supabase Auth
#     auth_response = supabase.auth.sign_up({"email": user.email, "password": user.password})

#     if "error" in auth_response and auth_response["error"]:
#         raise HTTPException(status_code=400, detail=auth_response["error"]["message"])

#     user_id = auth_response["user"]["id"]  # Get user ID from Supabase Auth
#     # Step 2: Insert user into 'users' table
#     user_data = {"id": user_id, "email": user.email, "role": user.role}
#     supabase.table("users").insert(user_data).execute()
#       # Step 3: Insert into respective table based on role
#     if user.role == "patient":
#         patient_data = {
#             "id": user_id,
#             "name": user.name,
#             "age": user.age,
#             "phone": user.phone,
#             "gender": user.gender,
#             "username": user.username
#         }
#         supabase.table("patients").insert(patient_data).execute()

#     elif user.role == "specialist":
#         specialist_data = {
#             "id": user_id,
#             "name": user.name,
#             "phone": user.phone,
#             "specialty": user.specialty,
#             "username": user.username
#         }
#         supabase.table("specialists").insert(specialist_data).execute()

#     else:
#         raise HTTPException(status_code=400, detail="Invalid role")

#     return {"message": "Signup successful!", "user_id": user_id}

# @app.post("/login")
# def login(user: UserLogin):
#     db = SessionLocal()
#     db_user = db.query(User).filter(User.username == user.username).first()
#     db.close()
    
#     if not db_user or not verify_password(user.password, db_user.password):
#         raise HTTPException(status_code=401, detail="Invalid credentials")

#     access_token = create_access_token({"sub": db_user.username}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
#     return {"access_token": access_token, "token_type": "bearer"}



