from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
import json
import os
from pathlib import Path
from datetime import datetime, timedelta
import jwt
import bcrypt
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="WC 2026 Rating Journal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = Path("data/journal.json")
DATA_FILE.parent.mkdir(exist_ok=True)

try:
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
except Exception:
    client = None # Allow running without groq key for dev

# ── Auth Config ───────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-key-12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ── Data helpers ──────────────────────────────────────────────────────────────
def load_data() -> dict:
    if DATA_FILE.exists():
        try:
            data = json.loads(DATA_FILE.read_text())
            if "users" not in data:
                # Migrate old global state to a default user or wipe it
                return {"users": {}}
            return data
        except Exception:
            return {"users": {}}
    return {"users": {}}

def save_data(data: dict):
    DATA_FILE.write_text(json.dumps(data, indent=2, default=str))

TEAMS_SEED = [
    {"code":"USA","name":"United States","flag":"🇺🇸","group":"A","confederation":"CONCACAF"},
    {"code":"MEX","name":"Mexico","flag":"🇲🇽","group":"A","confederation":"CONCACAF"},
    {"code":"CAN","name":"Canada","flag":"🇨🇦","group":"A","confederation":"CONCACAF"},
    {"code":"URU","name":"Uruguay","flag":"🇺🇾","group":"A","confederation":"CONMEBOL"},
    {"code":"ARG","name":"Argentina","flag":"🇦🇷","group":"B","confederation":"CONMEBOL"},
    {"code":"BRA","name":"Brazil","flag":"🇧🇷","group":"B","confederation":"CONMEBOL"},
    {"code":"CHI","name":"Chile","flag":"🇨🇱","group":"B","confederation":"CONMEBOL"},
    {"code":"PER","name":"Peru","flag":"🇵🇪","group":"B","confederation":"CONMEBOL"},
    {"code":"FRA","name":"France","flag":"🇫🇷","group":"C","confederation":"UEFA"},
    {"code":"ENG","name":"England","flag":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","group":"C","confederation":"UEFA"},
    {"code":"BEL","name":"Belgium","flag":"🇧🇪","group":"C","confederation":"UEFA"},
    {"code":"WAL","name":"Wales","flag":"🏴󠁧󠁢󠁷󠁬󠁳󠁿","group":"C","confederation":"UEFA"},
    {"code":"GER","name":"Germany","flag":"🇩🇪","group":"D","confederation":"UEFA"},
    {"code":"ESP","name":"Spain","flag":"🇪🇸","group":"D","confederation":"UEFA"},
    {"code":"POR","name":"Portugal","flag":"🇵🇹","group":"D","confederation":"UEFA"},
    {"code":"TUR","name":"Turkey","flag":"🇹🇷","group":"D","confederation":"UEFA"},
    {"code":"NED","name":"Netherlands","flag":"🇳🇱","group":"E","confederation":"UEFA"},
    {"code":"DEN","name":"Denmark","flag":"🇩🇰","group":"E","confederation":"UEFA"},
    {"code":"AUT","name":"Austria","flag":"🇦🇹","group":"E","confederation":"UEFA"},
    {"code":"SCO","name":"Scotland","flag":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","group":"E","confederation":"UEFA"},
    {"code":"ITA","name":"Italy","flag":"🇮🇹","group":"F","confederation":"UEFA"},
    {"code":"CRO","name":"Croatia","flag":"🇭🇷","group":"F","confederation":"UEFA"},
    {"code":"SRB","name":"Serbia","flag":"🇷🇸","group":"F","confederation":"UEFA"},
    {"code":"ALB","name":"Albania","flag":"🇦🇱","group":"F","confederation":"UEFA"},
    {"code":"MAR","name":"Morocco","flag":"🇲🇦","group":"G","confederation":"CAF"},
    {"code":"SEN","name":"Senegal","flag":"🇸🇳","group":"G","confederation":"CAF"},
    {"code":"EGY","name":"Egypt","flag":"🇪🇬","group":"G","confederation":"CAF"},
    {"code":"CMR","name":"Cameroon","flag":"🇨🇲","group":"G","confederation":"CAF"},
    {"code":"JPN","name":"Japan","flag":"🇯🇵","group":"H","confederation":"AFC"},
    {"code":"KOR","name":"South Korea","flag":"🇰🇷","group":"H","confederation":"AFC"},
    {"code":"AUS","name":"Australia","flag":"🇦🇺","group":"H","confederation":"AFC"},
    {"code":"IRN","name":"Iran","flag":"🇮🇷","group":"H","confederation":"AFC"},
    {"code":"SAU","name":"Saudi Arabia","flag":"🇸🇦","group":"I","confederation":"AFC"},
    {"code":"QAT","name":"Qatar","flag":"🇶🇦","group":"I","confederation":"AFC"},
    {"code":"IRQ","name":"Iraq","flag":"🇮🇶","group":"I","confederation":"AFC"},
    {"code":"UAE","name":"UAE","flag":"🇦🇪","group":"I","confederation":"AFC"},
    {"code":"COL","name":"Colombia","flag":"🇨🇴","group":"J","confederation":"CONMEBOL"},
    {"code":"ECU","name":"Ecuador","flag":"🇪🇨","group":"J","confederation":"CONMEBOL"},
    {"code":"VEN","name":"Venezuela","flag":"🇻🇪","group":"J","confederation":"CONMEBOL"},
    {"code":"BOL","name":"Bolivia","flag":"🇧🇴","group":"J","confederation":"CONMEBOL"},
    {"code":"NGA","name":"Nigeria","flag":"🇳🇬","group":"K","confederation":"CAF"},
    {"code":"CIV","name":"Côte d'Ivoire","flag":"🇨🇮","group":"K","confederation":"CAF"},
    {"code":"GHA","name":"Ghana","flag":"🇬🇭","group":"K","confederation":"CAF"},
    {"code":"MLI","name":"Mali","flag":"🇲🇱","group":"K","confederation":"CAF"},
    {"code":"POL","name":"Poland","flag":"🇵🇱","group":"L","confederation":"UEFA"},
    {"code":"CZE","name":"Czech Republic","flag":"🇨🇿","group":"L","confederation":"UEFA"},
    {"code":"SVK","name":"Slovakia","flag":"🇸🇰","group":"L","confederation":"UEFA"},
    {"code":"HUN","name":"Hungary","flag":"🇭🇺","group":"L","confederation":"UEFA"},
]

def seed_teams_for_user(username: str, data: dict):
    if "teams" not in data["users"][username]:
        data["users"][username]["teams"] = {}
    for t in TEAMS_SEED:
        if t["code"] not in data["users"][username]["teams"]:
            data["users"][username]["teams"][t["code"]] = {
                **t,
                "matches": [],
                "status": "active",
                "closed": False,
                "narrative": None,
                "narrative_type": None,
                "narrative_updated": None,
            }

# ── Auth functions ────────────────────────────────────────────────────────────
def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')[:72]
    try:
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    data = load_data()
    if username not in data["users"]:
        raise credentials_exception
    return username

# ── Pydantic models ───────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    username: str
    password: str

class MatchRating(BaseModel):
    opponent: str
    score: str
    stage: str
    attack: int
    defense: int
    tactics: int
    spirit: int
    overall: int
    note: Optional[str] = ""

class TeamStatusUpdate(BaseModel):
    status: str
    closed: bool

# ── Auth endpoints ────────────────────────────────────────────────────────────

@app.post("/register")
def register(user: UserRegister):
    data = load_data()
    if user.username in data["users"]:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    data["users"][user.username] = {
        "password_hash": get_password_hash(user.password),
        "teams": {}
    }
    seed_teams_for_user(user.username, data)
    save_data(data)
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "username": user.username}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    data = load_data()
    user = data["users"].get(form_data.username)
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer", "username": form_data.username}

@app.get("/me")
def read_users_me(current_user: str = Depends(get_current_user)):
    return {"username": current_user}


# ── Team endpoints ────────────────────────────────────────────────────────────

@app.get("/teams")
def get_teams(current_user: str = Depends(get_current_user)):
    data = load_data()
    return data["users"][current_user].get("teams", {})

@app.get("/teams/{code}")
def get_team(code: str, current_user: str = Depends(get_current_user)):
    data = load_data()
    team = data["users"][current_user]["teams"].get(code)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@app.patch("/teams/{code}/status")
def update_team_status(code: str, body: TeamStatusUpdate, current_user: str = Depends(get_current_user)):
    data = load_data()
    if code not in data["users"][current_user]["teams"]:
        raise HTTPException(status_code=404, detail="Team not found")
    data["users"][current_user]["teams"][code]["status"] = body.status
    data["users"][current_user]["teams"][code]["closed"] = body.closed
    save_data(data)
    return data["users"][current_user]["teams"][code]


# ── Match endpoints ───────────────────────────────────────────────────────────

@app.get("/teams/{code}/matches")
def get_matches(code: str, current_user: str = Depends(get_current_user)):
    data = load_data()
    team = data["users"][current_user]["teams"].get(code)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team.get("matches", [])

@app.post("/teams/{code}/matches")
def add_match(code: str, match: MatchRating, current_user: str = Depends(get_current_user)):
    data = load_data()
    if code not in data["users"][current_user]["teams"]:
        raise HTTPException(status_code=404, detail="Team not found")
    entry = match.model_dump()
    entry["id"] = f"{code}_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"
    entry["created_at"] = datetime.utcnow().isoformat()
    data["users"][current_user]["teams"][code].setdefault("matches", []).append(entry)
    save_data(data)
    return entry

@app.delete("/teams/{code}/matches/{match_id}")
def delete_match(code: str, match_id: str, current_user: str = Depends(get_current_user)):
    data = load_data()
    if code not in data["users"][current_user]["teams"]:
        raise HTTPException(status_code=404, detail="Team not found")
    matches = data["users"][current_user]["teams"][code].get("matches", [])
    data["users"][current_user]["teams"][code]["matches"] = [m for m in matches if m["id"] != match_id]
    save_data(data)
    return {"deleted": match_id}


# ── Narrative endpoints ───────────────────────────────────────────────────────

@app.post("/teams/{code}/narrative")
def generate_narrative(code: str, current_user: str = Depends(get_current_user)):
    data = load_data()
    team = data["users"][current_user]["teams"].get(code)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    matches = team.get("matches", [])
    if not matches:
        raise HTTPException(status_code=400, detail="No matches rated yet")

    is_closed = team.get("closed", False)
    team_name = team["name"]

    match_lines = []
    for i, m in enumerate(matches, 1):
        line = (
            f"Match {i} — {team_name} vs {m['opponent']} ({m['score']}) · {m.get('stage','')}\n"
            f"  Attack {m['attack']}/10 · Defense {m['defense']}/10 · "
            f"Tactics {m['tactics']}/10 · Spirit {m['spirit']}/10 · Overall {m['overall']}/10\n"
            f"  Notes: {m['note'] or 'None'}"
        )
        match_lines.append(line)

    match_block = "\n\n".join(match_lines)

    if is_closed:
        system = (
            "You are a celebrated football journalist writing the definitive retrospective "
            "of a team's World Cup campaign for a prestige sports magazine. Your prose is "
            "literary, precise, and emotionally resonant — the kind of writing people save. "
            "Write 4-5 paragraphs. Open with a vivid scene or motif that captures the team's "
            "essence. Then trace the arc of their campaign chronologically, weaving in the "
            "specific ratings and notes as evidence. Close with a final verdict on their legacy "
            "at this tournament. No bullet points. No markdown. Plain flowing prose."
        )
        user_prompt = (
            f"Write the final campaign retrospective for {team_name} at the 2026 FIFA World Cup.\n\n"
            f"Campaign status: {'Champion' if team.get('status') == 'champion' else 'Eliminated'}\n\n"
            f"Match ratings:\n\n{match_block}"
        )
    else:
        system = (
            "You are a sharp football analyst writing a running narrative journal about a team's "
            "World Cup campaign. Your tone is authoritative yet passionate — you've watched every "
            "minute. Write 2-3 paragraphs that tell the story of the campaign so far, referencing "
            "the specific match performances and ratings. Be analytical about patterns you see "
            "(improving/declining form, tactical consistency, standout moments). End with a "
            "forward-looking sentence about what to watch for. No bullet points. No markdown. "
            "Plain flowing prose."
        )
        user_prompt = (
            f"Write the current campaign narrative for {team_name} at the 2026 FIFA World Cup.\n\n"
            f"Matches rated so far:\n\n{match_block}"
        )

    def stream():
        full_text = ""
        if client is None:
            yield f"data: {json.dumps({'chunk': 'Groq client not configured.'})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
            return
            
        stream_resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=1000,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_prompt}
            ],
            stream=True
        )
        for chunk in stream_resp:
            text = chunk.choices[0].delta.content
            if text:
                full_text += text
                yield f"data: {json.dumps({'chunk': text})}\n\n"

        # Persist the completed narrative
        data2 = load_data()
        data2["users"][current_user]["teams"][code]["narrative"] = full_text
        data2["users"][current_user]["teams"][code]["narrative_type"] = "final" if is_closed else "live"
        data2["users"][current_user]["teams"][code]["narrative_updated"] = datetime.utcnow().isoformat()
        save_data(data2)
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")

@app.get("/teams/{code}/narrative")
def get_narrative(code: str, current_user: str = Depends(get_current_user)):
    data = load_data()
    team = data["users"][current_user]["teams"].get(code)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return {
        "narrative": team.get("narrative"),
        "narrative_type": team.get("narrative_type"),
        "narrative_updated": team.get("narrative_updated"),
    }

@app.post("/seed")
def seed_teams(current_user: str = Depends(get_current_user)):
    data = load_data()
    seed_teams_for_user(current_user, data)
    save_data(data)
    return {"seeded": len(TEAMS_SEED), "total": len(data["users"][current_user]["teams"])}

@app.get("/")
def root():
    return {"status": "ok", "service": "WC 2026 Rating Journal API"}
