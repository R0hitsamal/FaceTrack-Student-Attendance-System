# FaceTrack Python Service

FastAPI microservice for face encoding and real-time recognition.

## Setup

```bash
pip install -r requirements.txt
python app.py
# Runs on http://localhost:8000
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | / | Health check + profile count |
| POST | /register-face | Register a new face encoding |
| POST | /recognize | Recognize a face from frame |
| DELETE | /remove-face/{student_id} | Remove face data |
| GET | /stats | List all profiles |

## Face Data Storage

Encodings are stored in `models_store/encodings.json` as a JSON map:
```json
{
  "mongoObjectId": [[128-float-vector], ...]
}
```

Multiple samples per student improve accuracy. Re-registering adds a new sample.

## Tuning

- `tolerance` in `/recognize` (default 0.5): lower = stricter matching
- Send multiple photos per student during registration for better accuracy
- Use good lighting and front-facing images
