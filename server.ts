import express from "express";
import type { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "data.json");
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

if (!fs.existsSync(DATA_FILE)) {
  const initialMessages = [
    {
      id: "1",
      title: "ஞாயிறு ஆராதனை - விசுவாசத்தின் மேன்மை",
      date: "2024-05-12",
      duration: "45:20",
      videoUrl: "https://youtu.be/3u05__FzYfw?si=OwaxxUyT3dyiPCFH",
      videoId: "3u05__FzYfw",
      thumbnail: "https://picsum.photos/seed/church1/400/400",
      createdAt: new Date().toISOString(),
      subMessages: [
        {
          id: "1-1",
          title: "பகுதி 1: விசுவாசம் என்றால் என்ன?",
          date: "2024-05-12",
          duration: "22:10",
          videoUrl: "https://youtu.be/3u05__FzYfw?si=OwaxxUyT3dyiPCFH",
          videoId: "3u05__FzYfw",
          thumbnail: "https://picsum.photos/seed/part1/400/400",
          partNumber: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: "1-2",
          title: "பகுதி 2: விசுவாசத்தின் கிரியைகள்",
          date: "2024-05-12",
          duration: "23:10",
          videoUrl: "https://youtu.be/3u05__FzYfw?si=OwaxxUyT3dyiPCFH",
          videoId: "3u05__FzYfw",
          thumbnail: "https://picsum.photos/seed/part2/400/400",
          partNumber: 2,
          createdAt: new Date().toISOString(),
        }
      ]
    },
    {
      id: "2",
      title: "குடும்பக் கூட்டம் - அன்பின் முக்கியத்துவம்",
      date: "2024-05-10",
      duration: "38:15",
      videoUrl: "https://youtu.be/3u05__FzYfw?si=OwaxxUyT3dyiPCFH",
      videoId: "3u05__FzYfw",
      thumbnail: "https://picsum.photos/seed/church2/400/400",
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      title: "வேதாகம படிப்பு - பவுலின் கடிதங்கள்",
      subtitle: "ரோமர் நிருபம் ஆழமான ஆய்வு",
      date: "2024-05-08",
      duration: "52:40",
      videoUrl: "https://youtu.be/3u05__FzYfw?si=OwaxxUyT3dyiPCFH",
      videoId: "3u05__FzYfw",
      thumbnail: "https://picsum.photos/seed/church3/400/400",
      createdAt: new Date().toISOString(),
      subMessages: [
        {
          id: "3-1",
          title: "அதிகாரம் 1: அறிமுகம்",
          date: "2024-05-08",
          duration: "26:20",
          videoUrl: "https://youtu.be/3u05__FzYfw?si=OwaxxUyT3dyiPCFH",
          videoId: "3u05__FzYfw",
          thumbnail: "https://picsum.photos/seed/romans1/400/400",
          partNumber: 1,
          createdAt: new Date().toISOString(),
        }
      ]
    }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify({ messages: initialMessages }, null, 2));
}

const app = express();
app.use(express.json());
app.use(cors());

interface MessageData {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  duration: string;
  videoUrl: string;
  videoId: string;
  thumbnail: string;
  partNumber?: number;
  createdAt: string;
  subMessages?: MessageData[];
}

interface PlaylistData {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  messageIds: string[];
}

interface AppData {
  messages: MessageData[];
  playlists: PlaylistData[];
}

const processPlaylists = (data: AppData) => {
  if (!data.playlists) data.playlists = [];
  data.playlists = data.playlists.map((pl: PlaylistData) => {
    const plMessages = pl.messageIds
      .map(id => data.messages.find((m: MessageData) => m.id === id))
      .filter((m): m is MessageData => m !== undefined)
      .sort((a, b) => {
        const aPart = a.partNumber;
        const bPart = b.partNumber;
        if (aPart !== undefined && bPart !== undefined) {
          if (aPart !== bPart) return aPart - bPart;
        } else if (aPart !== undefined) {
          return -1;
        } else if (bPart !== undefined) {
          return 1;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    const firstMsg = plMessages[0];
    const thumbnail = firstMsg 
      ? (firstMsg.videoId ? `https://img.youtube.com/vi/${firstMsg.videoId}/0.jpg` : firstMsg.thumbnail)
      : "https://picsum.photos/seed/playlist/400/400";

    return {
      ...pl,
      messageIds: plMessages.map(m => m.id),
      thumbnail
    };
  });
  return data;
};

const getData = (): AppData => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  return processPlaylists(data);
};

const saveData = (data: AppData) => {
  const processedData = processPlaylists(data);
  fs.writeFileSync(DATA_FILE, JSON.stringify(processedData, null, 2));
};

const authenticateAdmin = (req: Request, res: Response, next: () => void) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    (req as Request & { admin?: string | jwt.JwtPayload }).admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  
  const submittedUser = username?.trim().toLowerCase();
  const submittedPass = password?.trim();

  const DEFAULT_USER = "admin";
  const DEFAULT_PASS = "admin123";

  const envUser = (process.env.ADMIN_USERNAME || DEFAULT_USER).trim().toLowerCase();
  const envPass = (process.env.ADMIN_PASSWORD || DEFAULT_PASS).trim();

  const isMatch = (submittedUser === DEFAULT_USER && submittedPass === DEFAULT_PASS) ||
                  (submittedUser === envUser && submittedPass === envPass);

  if (isMatch) {
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "7d" });
    return res.json({ token });
  }

  res.status(401).json({ error: "Invalid credentials" });
});

app.post("/api/messages/reorder", authenticateAdmin, (req, res) => {
  const { messageIds } = req.body;
  if (!Array.isArray(messageIds)) return res.status(400).json({ error: "Invalid data" });

  const data = getData();
  const reorderedMessages = messageIds
    .map(id => data.messages.find(m => m.id === id))
    .filter((m): m is MessageData => m !== undefined);

  data.messages = reorderedMessages;
  saveData(data);
  res.json({ success: true });
});

app.get("/api/messages", (_req, res) => {
  const data = getData();
  res.json(data.messages);
});

app.post("/api/messages", authenticateAdmin, (req, res) => {
  const data = getData();
  const newMessage: MessageData = { 
    ...req.body, 
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  data.messages.unshift(newMessage);
  saveData(data);
  res.json(newMessage);
});

app.put("/api/messages/:id", authenticateAdmin, (req, res) => {
  const data = getData();
  const index = data.messages.findIndex((m) => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Not found" });

  data.messages[index] = { ...data.messages[index], ...req.body };
  saveData(data);
  res.json(data.messages[index]);
});

app.delete("/api/messages/:id", authenticateAdmin, (req, res) => {
  const data = getData();
  data.messages = data.messages.filter((m) => m.id !== req.params.id);
  saveData(data);
  res.json({ success: true });
});

app.get("/api/playlists", (_req, res) => {
  const data = getData();
  res.json(data.playlists || []);
});

app.post("/api/playlists", authenticateAdmin, (req, res) => {
  const data = getData();
  const newPlaylist: PlaylistData = { ...req.body, id: `pl-${Date.now()}` };
  if (!data.playlists) data.playlists = [];
  data.playlists.unshift(newPlaylist);
  saveData(data);
  res.json(newPlaylist);
});

app.put("/api/playlists/:id", authenticateAdmin, (req, res) => {
  const data = getData();
  const index = data.playlists.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Not found" });

  data.playlists[index] = { ...data.playlists[index], ...req.body };
  saveData(data);
  res.json(data.playlists[index]);
});

app.delete("/api/playlists/:id", authenticateAdmin, (req, res) => {
  const data = getData();
  data.playlists = data.playlists.filter((p) => p.id !== req.params.id);
  saveData(data);
  res.json({ success: true });
});

app.get("/api/admin/export", authenticateAdmin, (_req, res) => {
  const data = getData();
  res.json(data);
});

app.post("/api/admin/import", authenticateAdmin, (req, res) => {
  const newData = req.body;
  if (!newData.messages || !Array.isArray(newData.messages)) {
    return res.status(400).json({ error: "Invalid data format. Must have 'messages' array." });
  }
  
  if (!newData.playlists) newData.playlists = [];
  
  saveData(newData);
  res.json({ success: true, message: "Data imported successfully" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();