export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // API: Config
    if (url.pathname === '/api/config' && request.method === 'GET') {
      const apiKey = env.ELEVENLABS_API_KEY || '';
      return new Response(JSON.stringify({
        apiKeyConfigured: Boolean(apiKey),
        defaultVoiceId: env.DEFAULT_VOICE_ID || '9v8bxagMX43JiaF92sqe',
        voices: [
          {
            id: env.DEFAULT_VOICE_ID || '9v8bxagMX43JiaF92sqe',
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
          { id: 'eleven_v3', name: 'Eleven v3', label: 'Eleven v3 (По умолчанию)', isRecommended: true },
          { id: 'eleven_multilingual_v2', name: 'Eleven Multilingual v2', label: 'Eleven Multilingual v2' },
          { id: 'eleven_turbo_v2_5', name: 'Eleven Turbo v2.5', label: 'Eleven Turbo v2.5 (Быстрая)' }
        ],
        presets: [
          {
            id: 'standard',
            title: 'Стандартный режим (Сбалансированный)',
            description: 'Сбалансированные параметры голоса для обычных реплик и объявлений',
            voiceSettings: { stability: 0.50, similarity_boost: 0.85, style: 0.30, speed: 1.00 }
          },
          {
            id: 'energetic_game',
            title: '🚀 Зовёт играть / Старт миссии',
            description: 'Бодрый, энергичный тембр для объявлений на аттракционах, запуска игр и квестов',
            voiceSettings: { stability: 0.38, similarity_boost: 0.85, style: 0.45, speed: 1.06 }
          },
          {
            id: 'birthday_hero',
            title: '🎂 День рождения / Поздравление',
            description: 'Искренний, праздничный, теплый голос для поздравлений именинников',
            voiceSettings: { stability: 0.45, similarity_boost: 0.90, style: 0.50, speed: 0.98 }
          },
          {
            id: 'secret_whisper',
            title: '🤫 Секрет / Таинственная подсказка',
            description: 'Шепотом, интригующий тембр для скрытых пасхалок и подсказок в интерактивных зонах',
            voiceSettings: { stability: 0.52, similarity_boost: 0.80, style: 0.30, speed: 0.92 }
          },
          {
            id: 'victory_prize',
            title: '🏆 Победа / Награждение',
            description: 'Восторг и аплодисменты для вручения джиббитсов, звёздочек и трофеев',
            voiceSettings: { stability: 0.40, similarity_boost: 0.88, style: 0.40, speed: 1.04 }
          },
          {
            id: 'welcome_guest',
            title: '👋 Приветствие гостей',
            description: 'Радушный, дружелюбный, гостеприимный тон для входной зоны и касс',
            voiceSettings: { stability: 0.48, similarity_boost: 0.85, style: 0.25, speed: 1.00 }
          },
          {
            id: 'rules_calm',
            title: '📢 Правила и безопасность',
            description: 'Чёткий, спокойный тон для понятных инструкций перед интерактивными зонами',
            voiceSettings: { stability: 0.65, similarity_boost: 0.85, style: 0.10, speed: 0.95 }
          }
        ]
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // API: Generate Speech
    if (url.pathname === '/api/generate' && request.method === 'POST') {
      try {
        const body = await request.json();
        const {
          text,
          voiceId = env.DEFAULT_VOICE_ID || '9v8bxagMX43JiaF92sqe',
          modelId = 'eleven_v3',
          stability = 0.5,
          similarityBoost = 0.85,
          style = 0.30,
          speed = 1.0,
          outputFormat = 'mp3_44100_128',
          presetId = 'standard'
        } = body;

        if (!text || !text.trim()) {
          return new Response(JSON.stringify({ error: 'Пожалуйста, введите текст для озвучивания.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const apiKey = env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: 'API ключ не настроен в Environment Variables.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${encodeURIComponent(outputFormat)}`;
        const elevenPayload = {
          text: text.trim(),
          model_id: modelId,
          voice_settings: {
            stability: Number(stability),
            similarity_boost: Number(similarityBoost),
            style: Number(style),
            speed: Number(speed),
            use_speaker_boost: true,
          },
        };

        const elevenRes = await fetch(elevenUrl, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify(elevenPayload),
        });

        if (!elevenRes.ok) {
          const errData = await elevenRes.json().catch(() => ({}));
          let friendlyMessage = 'Произошла ошибка при генерации аудио.';
          let isBillingIssue = false;

          if (errData?.detail?.status === 'payment_issue' || errData?.detail?.code === 'payment_issue') {
            friendlyMessage = 'Подписка закончилась. Обратитесь к аккаунт-менеджеру, чтобы продлить.';
            isBillingIssue = true;
          } else if (errData?.detail?.message) {
            friendlyMessage = errData.detail.message;
          }

          return new Response(JSON.stringify({
            success: false,
            error: friendlyMessage,
            status: elevenRes.status,
            isBillingIssue,
            raw: errData,
          }), {
            status: elevenRes.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Return MP3 audio directly as attachment/stream
        const audioBuffer = await elevenRes.arrayBuffer();
        return new Response(audioBuffer, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': 'attachment; filename="rocky_voice.mp3"',
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Внутренняя ошибка сервера: ' + err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Static assets fallback
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      const acceptsHtml = request.headers.get("accept")?.includes("text/html");
      if (response.status === 404 && acceptsHtml && ["GET", "HEAD"].includes(request.method)) {
        const indexUrl = new URL(request.url);
        indexUrl.pathname = "/index.html";
        indexUrl.search = "";
        return env.ASSETS.fetch(new Request(indexUrl, request));
      }
      return response;
    }

    return new Response('Not Found', { status: 404 });
  },
};
