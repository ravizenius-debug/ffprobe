# ffprobe-duration-api

Simple API to get video duration from a public video URL using ffprobe.

## Endpoints

### Health check
GET /health

### Get duration
POST /duration

Body:
```json
{
  "url": "https://example.com/video.mp4"
}
