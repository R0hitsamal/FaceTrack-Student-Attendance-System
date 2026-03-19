"""
FaceTrack Python Microservice (OpenCV Version)
Face Detection + Basic Recognition using LBPH
"""

import base64
import io
import os
import json
import numpy as np
import cv2
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="FaceTrack OpenCV Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Paths ───────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "models_store", "lbph_model.xml")
LABELS_PATH = os.path.join(BASE_DIR, "models_store", "labels.json")

os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

# ── OpenCV Setup ────────────────────────────────────────────────────────
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

recognizer = cv2.face.LBPHFaceRecognizer_create()

labels = {}       # {student_id: label_id}
label_map = {}    # {label_id: student_id}
current_label = 0

# ── Load / Save ─────────────────────────────────────────────────────────
def load_model():
    global labels, label_map, current_label
    if os.path.exists(LABELS_PATH):
        with open(LABELS_PATH, "r") as f:
            labels = json.load(f)
        label_map.update({v: k for k, v in labels.items()})
        current_label = len(labels)

    if os.path.exists(MODEL_PATH):
        recognizer.read(MODEL_PATH)
        print("✅ Model loaded")

def save_model():
    recognizer.write(MODEL_PATH)
    with open(LABELS_PATH, "w") as f:
        json.dump(labels, f)

load_model()

# ── Helpers ─────────────────────────────────────────────────────────────
def decode_image(b64_string: str) -> np.ndarray:
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    img_bytes = base64.b64decode(b64_string)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return np.array(img)

def detect_face(img):
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    return faces, gray

# ── Schemas ─────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    student_id: str
    image_base64: str

class RecognizeRequest(BaseModel):
    image_base64: str

# ── Routes ──────────────────────────────────────────────────────────────
@app.get("/")
def health():
    return {"status": "ok", "profiles": len(labels)}

# ── Register Face ───────────────────────────────────────────────────────
@app.post("/register-face")
def register_face(req: RegisterRequest):
    global current_label

    try:
        img = decode_image(req.image_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    faces, gray = detect_face(img)

    if len(faces) == 0:
        return {"success": False, "message": "No face detected"}

    (x, y, w, h) = faces[0]
    face = gray[y:y+h, x:x+w]

    if req.student_id not in labels:
        labels[req.student_id] = current_label
        label_map[current_label] = req.student_id
        current_label += 1

    label_id = labels[req.student_id]

    try:
        recognizer.update([face], np.array([label_id]))
    except:
        recognizer.train([face], np.array([label_id]))

    save_model()

    return {
        "success": True,
        "student_id": req.student_id,
        "label_id": label_id
    }

# ── Recognize Face ──────────────────────────────────────────────────────
@app.post("/recognize")
def recognize_face(req: RecognizeRequest):
    if not labels:
        return {"matched": False, "message": "No registered faces"}

    try:
        img = decode_image(req.image_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    faces, gray = detect_face(img)

    if len(faces) == 0:
        return {"matched": False, "message": "No face detected"}

    (x, y, w, h) = faces[0]
    face = gray[y:y+h, x:x+w]

    label_id, confidence = recognizer.predict(face)

    student_id = label_map.get(label_id, "Unknown")

    return {
        "matched": True,
        "student_id": student_id,
        "confidence": round(100 - confidence, 2)
    }

# ── Remove Face ─────────────────────────────────────────────────────────
@app.delete("/remove-face/{student_id}")
def remove_face(student_id: str):
    if student_id in labels:
        del labels[student_id]
        save_model()
        return {"success": True}
    return {"success": False, "message": "Not found"}

# ── Stats ───────────────────────────────────────────────────────────────
@app.get("/stats")
def stats():
    return {
        "total_profiles": len(labels),
        "profiles": list(labels.keys())
    }

# ── Run Server ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)