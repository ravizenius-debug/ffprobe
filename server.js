const express = require("express");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "";

function isValidHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function formatDuration(seconds) {
  const totalSeconds = Math.floor(Number(seconds || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "ffprobe-duration-api"
  });
});

app.post("/duration", (req, res) => {
  const headerApiKey = req.headers["x-api-key"];

  if (API_KEY && headerApiKey !== API_KEY) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized"
    });
  }

  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({
      ok: false,
      error: "url is required"
    });
  }

  if (!isValidHttpUrl(url)) {
    return res.status(400).json({
      ok: false,
      error: "invalid url"
    });
  }

  ffmpeg.ffprobe(url, (err, metadata) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        error: "ffprobe failed",
        details: err.message
      });
    }

    const duration = Number(metadata?.format?.duration || 0);

    return res.json({
      ok: true,
      url,
      duration_seconds: duration,
      duration_readable: formatDuration(duration),
      format_name: metadata?.format?.format_name || null,
      size_bytes: metadata?.format?.size ? Number(metadata.format.size) : null,
      bit_rate: metadata?.format?.bit_rate ? Number(metadata.format.bit_rate) : null
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
