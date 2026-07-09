from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import json
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional, List, AsyncGenerator

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# REPLACED broken private library with official Google Gemini API
import google.generativeai as genai

# ---------- CONFIG ----------
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = "HS256"
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

# Initialize the Gemini API
genai.configure(api_key=EMERGENT_LLM_KEY)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Dragon Ask API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dragon-ai")


# ---------- MODELS ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    created_at: str

class ChatMessageIn(BaseModel):
    session_id: str
    message: str

class GenerateTaskIn(BaseModel):
    difficulty: str = "beginner"
    tech: str = "html"

class SaveTaskIn(BaseModel):
    title: str
    difficulty: str
    tech: str
    description: str
    starter_code: Optional[str] = ""

# ---------- AUTH HELPERS ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else None
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user

# ---------- ROUTES: AUTH ----------
@api.post("/auth/register")
async def register(data: RegisterIn):
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(400, "Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid,
        "email": email,
        "name": data.name,
        "password_hash": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_access_token(uid, email)
    return {"token": token, "user": {"id": uid, "email": email, "name": data.name, "created_at": doc["created_at"]}}

@api.post("/auth/login")
async def login(data: LoginIn):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_access_token(user["id"], email)
    return {"token": token, "user": {"id": user["id"], "email": email, "name": user["name"], "created_at": user["created_at"]}}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

# ---------- ROUTES: CHAT ----------
DRAGON_SYSTEM = (
    "You are Dragon AI, a friendly and expert coding tutor specialized in HTML, CSS, and JavaScript. "
    "When users ask questions, respond in clear markdown with headings, short explanations, and complete "
    "runnable code blocks (```html, ```css, ```js). Give hands-on tasks and encouragement. Keep answers "
    "focused and educational. If the user asks for a task, provide: (1) title, (2) difficulty, (3) clear "
    "instructions, and (4) starter code."
)

async def chat_stream_generator(session_id: str, message: str, user_id: str) -> AsyncGenerator[str, None]:
    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "user_id": user_id,
        "role": "user",
        "content": message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    past_msgs = await db.chat_messages.find(
        {"session_id": session_id, "user_id": user_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(100)

    history = []
    for m in past_msgs[:-1]: 
        role = "user" if m["role"] == "user" else "model"
        history.append({"role": role, "parts": [m["content"]]})

    full = ""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=DRAGON_SYSTEM)
        chat = model.start_chat(history=history)
        response = await chat.send_message_async(message, stream=True)
        
        async for chunk in response:
            if chunk.text:
                full += chunk.text
                yield f"data: {json.dumps({'delta': chunk.text})}\n\n"
    except Exception as e:
        logger.exception("LLM stream error")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

    await db.chat_messages.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "user_id": user_id,
        "role": "assistant",
        "content": full,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    yield f"data: {json.dumps({'done': True})}\n\n"

@api.post("/chat/stream")
async def chat_stream(data: ChatMessageIn, user: dict = Depends(get_current_user)):
    return StreamingResponse(
        chat_stream_generator(data.session_id, data.message, user["id"]),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

@api.get("/chat/history/{session_id}")
async def chat_history(session_id: str, user: dict = Depends(get_current_user)):
    msgs = await db.chat_messages.find(
        {"session_id": session_id, "user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return msgs

@api.get("/chat/sessions")
async def chat_sessions(user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": user["id"]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$session_id",
            "last_message": {"$first": "$content"},
            "last_time": {"$first": "$created_at"},
        }},
        {"$sort": {"last_time": -1}},
        {"$limit": 50},
    ]
    result = await db.chat_messages.aggregate(pipeline).to_list(50)
    return [{"session_id": r["_id"], "preview": (r["last_message"] or "")[:80], "last_time": r["last_time"]} for r in result]

# ---------- ROUTES: TASKS ----------
TASK_SYSTEM = (
    "You are Dragon AI, a coding challenge generator. Generate ONE original coding task. "
    "Respond ONLY with valid JSON matching exactly this schema (no markdown fences, no extra text): "
    '{"title": string, "difficulty": string, "tech": string, "description": string, "starter_code": string, "hints": [string]}'
)

@api.post("/tasks/generate")
async def generate_task(data: GenerateTaskIn, user: dict = Depends(get_current_user)):
    prompt = (
        f"Generate a {data.difficulty} level coding task for {data.tech.upper()}. "
        "The description should be 2-4 sentences. starter_code must be valid HTML/CSS/JS boilerplate to help user start. "
        "Include 2 helpful hints. Respond with strict JSON only."
    )
    
    full = ""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=TASK_SYSTEM)
        response = await model.generate_content_async(prompt)
        full = response.text
    except Exception as e:
        logger.exception("LLM task error")

    text = full.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    start = text.find("{")
    end = text.rfind("}")
    task_obj = {}
    if start != -1 and end != -1:
        try:
            task_obj = json.loads(text[start:end + 1])
        except Exception:
            task_obj = {}

    if not task_obj:
        task_obj = {
            "title": f"{data.tech.upper()} {data.difficulty.title()} Challenge",
            "difficulty": data.difficulty,
            "tech": data.tech,
            "description": "Build a small project using the selected technology.",
            "starter_code": "",
            "hints": [],
        }

    task_obj["id"] = str(uuid.uuid4())
    task_obj["generated_at"] = datetime.now(timezone.utc).isoformat()
    return task_obj

@api.post("/tasks/save")
async def save_task(data: SaveTaskIn, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": data.title,
        "difficulty": data.difficulty,
        "tech": data.tech,
        "description": data.description,
        "starter_code": data.starter_code or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.saved_tasks.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/tasks/saved")
async def list_saved_tasks(user: dict = Depends(get_current_user)):
    tasks = await db.saved_tasks.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return tasks

# ---------- ROUTES: LESSONS ----------
LESSONS = [
    {"id": "html-1", "tech": "html", "title": "HTML Basics", "level": "Beginner",
     "summary": "Learn tags, elements, attributes, and document structure.",
     "content": "# HTML Basics\n\nHTML (HyperText Markup Language) structures web pages using tags.\n\n## Example\n```html\n<!DOCTYPE html>\n<html>\n  <head><title>My Page</title></head>\n  <body><h1>Hello World</h1></body>\n</html>\n```\n\n## Key Tags\n- `<h1>`–`<h6>`: headings\n- `<p>`: paragraph\n- `<a href>`: link\n- `<img src>`: image"},
    {"id": "html-2", "tech": "html", "title": "Forms & Inputs", "level": "Intermediate",
     "summary": "Build interactive forms using inputs, labels, and buttons.",
     "content": "# Forms\n\nForms collect user data.\n\n```html\n<form>\n  <label>Name: <input type=\"text\" name=\"name\"></label>\n  <button type=\"submit\">Send</button>\n</form>\n```"},
    {"id": "css-1", "tech": "css", "title": "CSS Selectors", "level": "Beginner",
     "summary": "Target elements with classes, ids, and combinators.",
     "content": "# CSS Selectors\n\n```css\np { color: red; }\n.title { font-size: 2rem; }\n#hero { background: black; }\n```"},
    {"id": "css-2", "tech": "css", "title": "Flexbox Layout", "level": "Intermediate",
     "summary": "Master one-dimensional layouts with flexbox.",
     "content": "# Flexbox\n\n```css\n.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 1rem;\n}\n```"},
    {"id": "css-3", "tech": "css", "title": "CSS Grid", "level": "Advanced",
     "summary": "Build responsive 2D grids with grid-template.",
     "content": "# CSS Grid\n\n```css\n.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 20px;\n}\n```"},
    {"id": "js-1", "tech": "js", "title": "JavaScript Variables & Types", "level": "Beginner",
     "summary": "Learn let, const, and primitive types.",
     "content": "# Variables\n\n```js\nconst name = 'Dragon';\nlet score = 0;\nscore = score + 10;\nconsole.log(name, score);\n```"},
    {"id": "js-2", "tech": "js", "title": "DOM Manipulation", "level": "Intermediate",
     "summary": "Select, update, and animate elements from JavaScript.",
     "content": "# DOM\n\n```js\nconst btn = document.querySelector('#go');\nbtn.addEventListener('click', () => {\n  document.body.style.background = 'crimson';\n});\n```"},
    {"id": "js-3", "tech": "js", "title": "Fetch API & Async", "level": "Advanced",
     "summary": "Make HTTP calls with fetch and async/await.",
     "content": "# Fetch\n\n```js\nasync function loadUser() {\n  const res = await fetch('/api/user');\n  const data = await res.json();\n  console.log(data);\n}\n```"},
    # The requested Wikipedia Data injection seamlessly added to the Lessons UI
    {"id": "wiki-1", "tech": "html", "title": "History of HTML (Wikipedia)", "level": "Beginner",
     "summary": "Wikipedia data on the origins of HTML.",
     "content": "# History of HTML\n\nAccording to Wikipedia, HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser. In 1980, physicist Tim Berners-Lee, a contractor at CERN, proposed and prototyped ENQUIRE, a system for CERN researchers to use and share documents. In 1989, Berners-Lee wrote a memo proposing an Internet-based hypertext system. Berners-Lee specified HTML and wrote the browser and server software in late 1990.\n\n*Source: Wikipedia*"}
]

@api.get("/lessons")
async def list_lessons():
    return LESSONS

@api.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: str):
    for lesson in LESSONS:
        if lesson["id"] == lesson_id:
            return lesson
    raise HTTPException(404, "Lesson not found")

# ---------- HEALTH ----------
@api.get("/")
async def root():
    return {"status": "ok", "service": "Dragon Ask AI"}

# ---------- STARTUP ----------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.chat_messages.create_index([("session_id", 1), ("created_at", 1)])
    await db.saved_tasks.create_index([("user_id", 1), ("created_at", -1)])

    # seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@dragonai.dev")
    admin_pw = os.environ.get("ADMIN_PASSWORD", "dragon123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Dragon Admin",
            "password_hash": hash_password(admin_pw),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_pw, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pw)}})

@app.on_event("shutdown")
async def shutdown():
    client.close()

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["https://dragon-ai-ask-5.onrender.com"],
    allow_methods=["*"],
    allow_headers=["*"],
)
