import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  }
  return env;
}

const env = loadEnv();
const PORT = parseInt(process.env.PORT || env.PORT || '3456', 10);
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY || '';
const DEFAULT_VOICE_ID = process.env.DEFAULT_VOICE_ID || env.DEFAULT_VOICE_ID || '9v8bxagMX43JiaF92sqe';

const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const GENERATED_DIR = path.join(__dirname, 'public', 'generated');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });
if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));

function readHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  // API Routes
  if (pathname === '/api/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      apiKeyConfigured: Boolean(ELEVENLABS_API_KEY),
      defaultVoiceId: DEFAULT_VOICE_ID,
      voices: [
        {
          id: DEFAULT_VOICE_ID,
          name: 'Лис Рокки (Русский)',
          lang: 'ru',
          isDefault: true,
          description: 'Официальный фирменный голос персонажа Hello Park',
          avatar: '/assets/rocky.png'
        },
        {
          id: 'voice_en_placeholder',
          name: 'Лис Рокки (English) — Скоро',
          lang: 'en',
          disabled: true,
          description: 'Английская локализация для международных парков',
          avatar: '/assets/rocky.png'
        },
        {
          id: 'voice_az_placeholder',
          name: 'Лис Рокки (Azərbaycan) — Скоро',
          lang: 'az',
          disabled: true,
          description: 'Азербайджанская локализация',
          avatar: '/assets/rocky.png'
        }
      ],
      models: [
        {
          id: 'eleven_v3',
          name: 'Eleven v3',
          label: 'Eleven v3 (По умолчанию)',
          isRecommended: true
        },
        {
          id: 'eleven_multilingual_v2',
          name: 'Eleven Multilingual v2',
          label: 'Eleven Multilingual v2 (Стабильная)'
        },
        {
          id: 'eleven_turbo_v2_5',
          name: 'Eleven Turbo v2.5',
          label: 'Eleven Turbo v2.5 (Быстрая)'
        }
      ],
      presets: [
        {
          id: 'standard',
          title: 'Стандартный режим (Сбалансированный)',
          subtitle: 'Фирменный тембр Рокки',
          description: 'Сбалансированные параметры голоса для большинства обычных объявлений в парке',
          voiceSettings: { stability: 0.50, similarity_boost: 0.85, style: 0.30, speed: 1.00 }
        },
        {
          id: 'energetic_game',
          title: '🚀 Зовёт играть / Старт миссии',
          subtitle: 'Бодрый, энергичный, увлекающий',
          description: 'Для объявлений на аттракционах, запуска игр и квестов',
          voiceSettings: { stability: 0.38, similarity_boost: 0.85, style: 0.45, speed: 1.06 }
        },
        {
          id: 'birthday_hero',
          title: '🎂 День рождения / Поздравление',
          subtitle: 'Искренний, праздничный, теплый',
          description: 'Для персональных поздравлений именинников на экранах и радио парка',
          voiceSettings: { stability: 0.45, similarity_boost: 0.90, style: 0.50, speed: 0.98 }
        },
        {
          id: 'secret_whisper',
          title: '🤫 Секрет / Таинственная подсказка',
          subtitle: 'Шепотом, интригующий, загадочный',
          description: 'Для скрытых пасхалок, головоломок и подсказок в интерактивных зонах',
          voiceSettings: { stability: 0.52, similarity_boost: 0.80, style: 0.30, speed: 0.92 }
        },
        {
          id: 'victory_prize',
          title: '🏆 Победа / Награждение',
          subtitle: 'Восторг, гордость, аплодисменты',
          description: 'Для вручения джиббитсов, звёздочек и призов за прохождение парка',
          voiceSettings: { stability: 0.40, similarity_boost: 0.88, style: 0.40, speed: 1.04 }
        },
        {
          id: 'welcome_guest',
          title: '👋 Приветствие гостей',
          subtitle: 'Радушный, дружелюбный, гостеприимный',
          description: 'Для входной зоны, экранов приветствия и касс',
          voiceSettings: { stability: 0.48, similarity_boost: 0.85, style: 0.25, speed: 1.00 }
        },
        {
          id: 'rules_calm',
          title: '📢 Правила и безопасность',
          subtitle: 'Чёткий, спокойный, понятный',
          description: 'Для понятных инструкций перед интерактивными зонами',
          voiceSettings: { stability: 0.65, similarity_boost: 0.85, style: 0.10, speed: 0.95 }
        }
      ]
    }));
    return;
  }

  if (pathname === '/api/history' && req.method === 'GET') {
    const history = readHistory();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(history));
    return;
  }

  if (pathname.startsWith('/api/history/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/history/', '').trim();
    let history = readHistory();
    const item = history.find(h => h.id === id);
    if (item) {
      if (item.audioPath && fs.existsSync(item.audioPath)) {
        try { fs.unlinkSync(item.audioPath); } catch (e) {}
      }
      history = history.filter(h => h.id !== id);
      writeHistory(history);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Запись не найдена' }));
    return;
  }

  if (pathname === '/api/generate' && req.method === 'POST') {
    let bodyText = '';
    req.on('data', chunk => { bodyText += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(bodyText);
        const {
          text,
          voiceId = DEFAULT_VOICE_ID,
          modelId = 'eleven_v4',
          stability = 0.5,
          similarityBoost = 0.85,
          style = 0.30,
          speed = 1.0,
          outputFormat = 'mp3_44100_128',
          presetId = 'standard'
        } = payload;

        if (!text || !text.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Пожалуйста, введите текст для озвучивания.' }));
          return;
        }

        const id = crypto.randomUUID();
        const fileName = `rocky_${Date.now()}_${id.slice(0, 8)}.mp3`;
        const filePath = path.join(GENERATED_DIR, fileName);
        const publicAudioUrl = `/generated/${fileName}`;

        // Call Voice Engine API
        const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${encodeURIComponent(outputFormat)}`;
        const elevenPayload = {
          text: text.trim(),
          model_id: modelId,
          voice_settings: {
            stability: Number(stability),
            similarity_boost: Number(similarityBoost),
            ...(modelId === 'eleven_v4' ? {} : { style: Number(style), speed: Number(speed), use_speaker_boost: true })
          }
        };

        let elevenRes;
        try {
          elevenRes = await fetch(elevenUrl, {
            method: 'POST',
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
              'Accept': 'audio/mpeg'
            },
            body: JSON.stringify(elevenPayload)
          });
        } catch (err) {
          console.error('[Voice Engine Connection Error]', err.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, code: 'upstream_unreachable' }));
          return;
        }

        if (!elevenRes.ok) {
          const errData = await elevenRes.json().catch(() => ({}));
          console.error('[Voice Engine Error]', elevenRes.status, errData);

          let friendlyMessage = 'Произошла ошибка при генерации аудио.';
          let isBillingIssue = false;

          if (errData?.detail?.status === 'payment_issue' || errData?.detail?.code === 'payment_issue') {
            friendlyMessage = 'Подписка закончилась. Обратитесь к аккаунт-менеджеру, чтобы продлить.';
            isBillingIssue = true;
          } else if (errData?.detail?.status === 'missing_permissions') {
            friendlyMessage = 'Недостаточно прав для генерации голоса. Обратитесь к аккаунт-менеджеру.';
          } else if (errData?.detail?.message) {
            friendlyMessage = errData.detail.message;
          }

          res.writeHead(elevenRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: friendlyMessage,
            status: elevenRes.status,
            code: errData?.detail?.status || errData?.detail?.code,
            isBillingIssue,
          }));
          return;
        }

        const audioBuffer = Buffer.from(await elevenRes.arrayBuffer());
        fs.writeFileSync(filePath, audioBuffer);

        const historyItem = {
          id,
          text: text.trim(),
          voiceId,
          modelId,
          presetId,
          audioUrl: publicAudioUrl,
          audioPath: filePath,
          sizeBytes: audioBuffer.length,
          settings: { stability, similarityBoost, style, speed },
          createdAt: new Date().toISOString()
        };

        const history = readHistory();
        history.unshift(historyItem);
        writeHistory(history);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          item: historyItem
        }));
      } catch (err) {
        console.error('[Generate Error]', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
    return;
  }

  // Static file serving from public/
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(path.join(__dirname, 'public'))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Rocky Voice Studio] Сервер запущен на http://localhost:${PORT}`);
});
