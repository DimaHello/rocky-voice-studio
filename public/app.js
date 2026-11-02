document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const scriptInput = document.getElementById('scriptInput');
  const charCount = document.getElementById('charCount');
  const btnClearText = document.getElementById('btnClearText');
  const btnGenerate = document.getElementById('btnGenerate');
  const genSpinner = document.getElementById('genSpinner');
  const billingBanner = document.getElementById('billingBanner');
  const generationError = document.getElementById('generationError');
  const generationErrorTitle = document.getElementById('generationErrorTitle');
  const generationErrorMessage = document.getElementById('generationErrorMessage');
  let activeGenerationError = null;

  // Sliders & selects
  const presetSelect = document.getElementById('presetSelect');
  const presetDesc = document.getElementById('presetDesc');
  const voiceSelect = document.getElementById('voiceSelect');
  const modelSelect = document.getElementById('modelSelect');
  const formatSelect = document.getElementById('formatSelect');
  const rangeStability = document.getElementById('rangeStability');
  const rangeSimilarity = document.getElementById('rangeSimilarity');
  const rangeStyle = document.getElementById('rangeStyle');
  const rangeSpeed = document.getElementById('rangeSpeed');
  const valStability = document.getElementById('valStability');
  const valSimilarity = document.getElementById('valSimilarity');
  const valStyle = document.getElementById('valStyle');
  const valSpeed = document.getElementById('valSpeed');
  const btnResetSettings = document.getElementById('btnResetSettings');

  // Player elements
  const playerSection = document.getElementById('playerSection');
  const audioElement = document.getElementById('audioElement');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const audioScrubber = document.getElementById('audioScrubber');
  const timeCurrent = document.getElementById('timeCurrent');
  const timeDuration = document.getElementById('timeDuration');
  const btnDownloadAudio = document.getElementById('btnDownloadAudio');

  // Sidebar Tabs & History
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const historyList = document.getElementById('historyList');
  const historyEmpty = document.getElementById('historyEmpty');
  const historyCount = document.getElementById('historyCount');

  // Built-in presets with recommended settings
  const presetsMap = {
    standard: {
      id: 'standard',
      title: 'Стандартный режим (Сбалансированный)',
      description: 'Сбалансированные параметры голоса для обычных реплик и объявлений',
      voiceSettings: { stability: 0.50, similarity_boost: 0.85, style: 0.30, speed: 1.00 }
    },
    energetic_game: {
      id: 'energetic_game',
      title: '🚀 Зовёт играть / Старт миссии',
      description: 'Бодрый, энергичный тембр для объявлений на аттракционах, запуска игр и квестов',
      voiceSettings: { stability: 0.38, similarity_boost: 0.85, style: 0.45, speed: 1.06 }
    },
    birthday_hero: {
      id: 'birthday_hero',
      title: '🎂 День рождения / Поздравление',
      description: 'Искренний, праздничный, теплый голос для поздравлений именинников',
      voiceSettings: { stability: 0.45, similarity_boost: 0.90, style: 0.50, speed: 0.98 }
    },
    secret_whisper: {
      id: 'secret_whisper',
      title: '🤫 Секрет / Таинственная подсказка',
      description: 'Шепотом, интригующий тембр для скрытых пасхалок и подсказок в интерактивных зонах',
      voiceSettings: { stability: 0.52, similarity_boost: 0.80, style: 0.30, speed: 0.92 }
    },
    victory_prize: {
      id: 'victory_prize',
      title: '🏆 Победа / Награждение',
      description: 'Восторг и аплодисменты для вручения джиббитсов, звёздочек и трофеев',
      voiceSettings: { stability: 0.40, similarity_boost: 0.88, style: 0.40, speed: 1.04 }
    },
    welcome_guest: {
      id: 'welcome_guest',
      title: '👋 Приветствие гостей',
      description: 'Радушный, дружелюбный, гостеприимный тон для входной зоны и касс',
      voiceSettings: { stability: 0.48, similarity_boost: 0.85, style: 0.25, speed: 1.00 }
    },
    rules_calm: {
      id: 'rules_calm',
      title: '📢 Правила и безопасность',
      description: 'Чёткий, спокойный тон для понятных инструкций перед интерактивными зонами',
      voiceSettings: { stability: 0.65, similarity_boost: 0.85, style: 0.10, speed: 0.95 }
    }
  };

  const DEFAULT_SETTINGS = {
    stability: 0.50,
    similarity: 0.85,
    style: 0.30,
    speed: 1.00,
    model: 'eleven_v4',
    voice: '9v8bxagMX43JiaF92sqe',
    preset: 'standard'
  };

  let localHistory = [];
  try {
    localHistory = JSON.parse(localStorage.getItem('rocky_voice_history') || '[]');
  } catch (e) {
    localHistory = [];
  }

  // Статический режим (GitHub Pages): ключ приходит из GitHub Secrets в config.js,
  // запрос к ElevenLabs уходит напрямую из браузера, без своего сервера.
  const STATIC_MODE = Boolean(window.ROCKY_CONFIG && window.ROCKY_CONFIG.elevenlabsKey);

  const languageOptions = document.querySelectorAll('input[name="interfaceLanguage"]');
  let currentLanguage = localStorage.getItem('rocky_language') === 'en' ? 'en' : 'ru';
  const english = {
    'Голосовая студия Лиса Рокки':'Rocky the Fox Voice Studio', 'Генерация официальных реплик персонажа для парков':'Create official character voiceovers for parks',
    'Подписка закончилась':'Subscription expired', 'Обратитесь к аккаунт-менеджеру, чтобы продлить доступ к генерациям.':'Contact your account manager to renew access.',
    'Лис Рокки Рус':'Rocky the Fox · EN', 'Подсказки:':'Suggestions:', '⏸️ Пауза':'⏸️ Pause', '🎉 Радостно':'🎉 Happy', '🤫 Шепотом':'🤫 Whisper', '💥 Восклицание':'💥 Exclamation',
    'Очистить':'Clear', 'Сгенерировать речь':'Generate speech', '⬇️ Скачать MP3':'⬇️ Download MP3', 'Настройки':'Settings', 'История':'History',
    'Интонация / Сценарий':'Tone / Scenario', 'Стандартный режим (Сбалансированный)':'Standard (balanced)', '🚀 Зовёт играть / Старт миссии':'🚀 Start a mission', '🎂 День рождения / Поздравление':'🎂 Birthday greeting', '🤫 Секрет / Таинственная подсказка':'🤫 Secret hint', '🏆 Победа / Награждение':'🏆 Victory / Prize', '👋 Приветствие гостей':'👋 Welcome guests', '📢 Правила и безопасность':'📢 Rules and safety',
    'Голос персонажа':'Character voice', '🦊 Лис Рокки (Русский)':'🦊 Rocky (Russian)', 'Модель нейросети':'AI model', 'Эмоциональность (Stability)':'Emotion (Stability)', 'Креативно и живо':'Creative and lively', 'Ровно и стабильно':'Calm and consistent', 'Сходство с тембром (Similarity)':'Voice similarity', 'Свободный тон':'More variation', 'Точный эталон Рокки':'Closer to Rocky', 'Выразительность стиля (Style)':'Style exaggeration', 'Скорость речи (Speed)':'Speech speed', 'Формат звука':'Audio format', 'Сбросить настройки к эталону':'Reset settings', 'Записей пока нет':'No recordings yet', 'Сгенерированные файлы будут появляться здесь.':'Your generated recordings will appear here.'
  };
  const translatable = [...document.querySelectorAll('h1, .header-subtitle, .alert-title, .alert-desc, .speaker-pill-name, .toolbar-label, .chip-tag, #btnClearText, .btn-text, .btn-compact-download, .tab-btn, .setting-label, .slider-hints span, #presetSelect option, #voiceSelect option, #btnResetSettings, .empty-title, .empty-desc')];
  const original = new Map();
  for (const el of translatable) for (const node of el.childNodes) if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) original.set(node, node.textContent);
  function updateModelSettings() {
    const disabled = modelSelect.value === 'eleven_v4';
    [rangeStyle, rangeSpeed].forEach(el => { el.disabled = disabled; el.closest('.setting-group').style.opacity = disabled ? '0.45' : ''; });
  }
  function applyLanguage(lang) {
    currentLanguage = lang; document.documentElement.lang = lang;
    languageOptions.forEach(option => { option.checked = option.value === lang; });
    try { localStorage.setItem('rocky_language', lang); } catch (_) {}
    for (const [node, text] of original) { const key = text.trim(); node.textContent = lang === 'en' && english[key] ? text.replace(key, english[key]) : text; }
    document.title = lang === 'en' ? 'Rocky the Fox Voice Studio | Hello Park' : 'Голосовая студия Лиса Рокки | Hello Park';
    scriptInput.placeholder = lang === 'en' ? 'Write a line for Rocky the Fox... For example: Hello! Welcome to Hello Park! Who is ready to play?' : 'Напишите реплику для Лиса Рокки... Например: Привет! Добро пожаловать в Hello Park! Кто готов к игре?';
    voiceSelect.value = lang === 'en' ? 'WBL0P03WvXYaheknMZG4' : '9v8bxagMX43JiaF92sqe';
    presetDesc.textContent = lang === 'en' ? 'Choose a starting point for your voice settings.' : (presetsMap[presetSelect.value]?.description || '');
    document.querySelectorAll('.chip-tag')[1].dataset.insert = lang === 'en' ? '[happy] ' : '[радостно] ';
    document.querySelectorAll('.chip-tag')[2].dataset.insert = lang === 'en' ? '[whispers] ' : '[шепотом] ';
    if (activeGenerationError) showGenerationError(activeGenerationError);
  }
  languageOptions.forEach(option => option.addEventListener('change', () => {
    if (option.checked) applyLanguage(option.value);
  }));
  modelSelect.addEventListener('change', updateModelSettings);
  applyLanguage(currentLanguage); updateModelSettings();

  // 1. Initial Config Fetch & Local History
  async function init() {
    if (!STATIC_MODE) {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data.presets && Array.isArray(data.presets)) {
            data.presets.forEach(p => { presetsMap[p.id] = p; });
          }
        }
      } catch (err) {
        console.warn('Config fetch skipped, using built-ins:', err);
      }
    }
    renderLocalHistory();
  }

  // 2. Preset dropdown handler
  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      const id = presetSelect.value;
      const preset = presetsMap[id];
      if (!preset) return;

      if (presetDesc) {
        presetDesc.textContent = currentLanguage === 'en' ? 'Settings adjusted for the selected scenario.' : (preset.description || '');
      }

      if (preset.voiceSettings) {
        if (preset.voiceSettings.stability !== undefined) {
          rangeStability.value = preset.voiceSettings.stability;
          valStability.textContent = Number(preset.voiceSettings.stability).toFixed(2);
        }
        if (preset.voiceSettings.similarity_boost !== undefined) {
          rangeSimilarity.value = preset.voiceSettings.similarity_boost;
          valSimilarity.textContent = Number(preset.voiceSettings.similarity_boost).toFixed(2);
        }
        if (preset.voiceSettings.style !== undefined) {
          rangeStyle.value = preset.voiceSettings.style;
          valStyle.textContent = Number(preset.voiceSettings.style).toFixed(2);
        }
        if (preset.voiceSettings.speed !== undefined) {
          rangeSpeed.value = preset.voiceSettings.speed;
          valSpeed.textContent = Number(preset.voiceSettings.speed).toFixed(2) + 'x';
        }
      }
    });
  }

  // 3. Toolbar insert chips
  document.querySelectorAll('.chip-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-insert');
      insertTextAtCursor(scriptInput, tag);
      updateCharCount();
    });
  });

  function insertTextAtCursor(input, textToInsert) {
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = input.value;
    input.value = text.substring(0, start) + textToInsert + text.substring(end);
    input.selectionStart = input.selectionEnd = start + textToInsert.length;
    input.focus();
  }

  // 4. Input counter & clear
  function updateCharCount() {
    const len = scriptInput.value.length;
    charCount.textContent = `${len.toLocaleString('ru-RU')} / 5 000`;
    if (len > 5000) {
      charCount.style.color = '#ef4444';
      btnGenerate.disabled = true;
    } else {
      charCount.style.color = 'var(--hp-text-muted)';
      btnGenerate.disabled = false;
    }
  }

  scriptInput.addEventListener('input', updateCharCount);
  btnClearText.addEventListener('click', () => {
    scriptInput.value = '';
    updateCharCount();
    scriptInput.focus();
  });

  // 5. Sliders sync
  rangeStability.addEventListener('input', () => {
    valStability.textContent = Number(rangeStability.value).toFixed(2);
  });
  rangeSimilarity.addEventListener('input', () => {
    valSimilarity.textContent = Number(rangeSimilarity.value).toFixed(2);
  });
  rangeStyle.addEventListener('input', () => {
    valStyle.textContent = Number(rangeStyle.value).toFixed(2);
  });
  rangeSpeed.addEventListener('input', () => {
    valSpeed.textContent = Number(rangeSpeed.value).toFixed(2) + 'x';
  });

  btnResetSettings.addEventListener('click', () => {
    presetSelect.value = DEFAULT_SETTINGS.preset;
    if (presetDesc && presetsMap['standard']) {
      presetDesc.textContent = currentLanguage === 'en' ? 'Choose a starting point for your voice settings.' : presetsMap['standard'].description;
    }

    rangeStability.value = DEFAULT_SETTINGS.stability;
    valStability.textContent = DEFAULT_SETTINGS.stability.toFixed(2);

    rangeSimilarity.value = DEFAULT_SETTINGS.similarity;
    valSimilarity.textContent = DEFAULT_SETTINGS.similarity.toFixed(2);

    rangeStyle.value = DEFAULT_SETTINGS.style;
    valStyle.textContent = DEFAULT_SETTINGS.style.toFixed(2);

    rangeSpeed.value = DEFAULT_SETTINGS.speed;
    valSpeed.textContent = DEFAULT_SETTINGS.speed.toFixed(2) + 'x';

    modelSelect.value = DEFAULT_SETTINGS.model;
    voiceSelect.value = currentLanguage === 'en' ? 'WBL0P03WvXYaheknMZG4' : DEFAULT_SETTINGS.voice;
    updateModelSettings();
  });

  // 6. Audio Player Logic
  function loadAudioResult(url) {
    playerSection.classList.remove('hidden');
    audioElement.src = url;
    btnDownloadAudio.href = url;

    audioElement.load();
    btnPlayPause.textContent = '▶';
    audioScrubber.value = 0;
    timeCurrent.textContent = '0:00';

    audioElement.onloadedmetadata = () => {
      timeDuration.textContent = formatTime(audioElement.duration || 0);
    };

    playerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  btnPlayPause.addEventListener('click', () => {
    if (audioElement.paused) {
      audioElement.play();
      btnPlayPause.textContent = '⏸';
    } else {
      audioElement.pause();
      btnPlayPause.textContent = '▶';
    }
  });

  audioElement.addEventListener('timeupdate', () => {
    if (audioElement.duration) {
      const pct = (audioElement.currentTime / audioElement.duration) * 100;
      audioScrubber.value = pct;
      timeCurrent.textContent = formatTime(audioElement.currentTime);
    }
  });

  audioElement.addEventListener('ended', () => {
    btnPlayPause.textContent = '▶';
    audioScrubber.value = 0;
    timeCurrent.textContent = '0:00';
  });

  audioScrubber.addEventListener('input', () => {
    if (audioElement.duration) {
      audioElement.currentTime = (audioScrubber.value / 100) * audioElement.duration;
    }
  });

  function formatTime(sec) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  const errorMessages = {
    'RV-001': ['Откройте студию по рабочей ссылке и попробуйте ещё раз. Если ошибка повторится, обратитесь к администратору.', 'Open the studio using its usual link and try again. If the problem continues, contact your administrator.'],
    'RV-002': ['Проверьте подключение к интернету и попробуйте ещё раз. Если ошибка повторится, обратитесь к администратору.', 'Check your internet connection and try again. If the problem continues, contact your administrator.'],
    'RV-003': ['Не удалось получить доступ к голосу. Обратитесь к администратору.', 'Could not access the voice. Contact your administrator.'],
    'RV-004': ['Исчерпан лимит или возникла проблема с оплатой. Обратитесь к администратору.', 'The quota has been reached or there is a billing problem. Contact your administrator.'],
    'RV-005': ['Слишком много запросов. Подождите немного и попробуйте ещё раз.', 'Too many requests. Wait a moment and try again.'],
    'RV-006': ['Проверьте текст и выбранный голос, затем попробуйте ещё раз. Если ошибка повторится, обратитесь к администратору.', 'Check your text and selected voice, then try again. If the problem continues, contact your administrator.'],
    'RV-007': ['Сервис временно недоступен или вернул ошибку. Попробуйте ещё раз позже.', 'The service is unavailable or returned an error. Please try again later.'],
    'RV-008': ['Получен неожиданный ответ сервиса. Попробуйте ещё раз или обратитесь к администратору.', 'The service returned an unexpected response. Try again or contact your administrator.']
  };
  function showGenerationError(code) {
    activeGenerationError = code;
    generationErrorTitle.textContent = currentLanguage === 'en' ? 'Could not generate audio' : 'Не удалось создать аудио';
    generationErrorMessage.textContent = (errorMessages[code] || errorMessages['RV-008'])[currentLanguage === 'en' ? 1 : 0];
    generationError.classList.remove('hidden');
  }
  function errorCodeForResponse(status, data) {
    if (data.isBillingIssue || data.code === 'payment_issue' || data.code === 'quota_exceeded') return 'RV-004';
    if (data.code === 'upstream_unreachable') return 'RV-002';
    if (status === 401 || status === 403) return 'RV-003';
    if (status === 402) return 'RV-004';
    if (status === 429) return 'RV-005';
    if (status === 400 || status === 404 || status === 422) return 'RV-006';
    if (status >= 500) return 'RV-007';
    return 'RV-008';
  }
  document.getElementById('dismissGenerationError').addEventListener('click', () => {
    activeGenerationError = null;
    generationError.classList.add('hidden');
  });

  // 7. Generation Trigger
  btnGenerate.addEventListener('click', async () => {
    activeGenerationError = null;
    generationError.classList.add('hidden');
    const text = scriptInput.value.trim();
    if (!text) {
      alert(currentLanguage === 'en' ? 'Please enter text for Rocky to read.' : 'Пожалуйста, введите текст для озвучивания Лиса Рокки.');
      scriptInput.focus();
      return;
    }

    if (location.protocol === 'file:' && !STATIC_MODE) {
      showGenerationError('RV-001');
      return;
    }
    setGenerating(true);

    try {
      const payload = {
        text,
        voiceId: voiceSelect.value,
        modelId: modelSelect.value,
        outputFormat: formatSelect.value,
        stability: parseFloat(rangeStability.value),
        similarityBoost: parseFloat(rangeSimilarity.value),
        style: parseFloat(rangeStyle.value),
        speed: parseFloat(rangeSpeed.value),
        presetId: presetSelect.value
      };

      const res = STATIC_MODE
        ? await requestElevenLabs(payload)
        : await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

      const contentType = res.headers.get('content-type') || '';

      // Direct audio blob response (Cloud / Sites Worker or local)
      if (res.ok && (contentType.includes('audio') || contentType.includes('octet-stream'))) {
        billingBanner.classList.add('hidden');
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        loadAudioResult(blobUrl);
        audioElement.play().catch(() => {});
        btnPlayPause.textContent = '⏸';

        saveToHistory({
          id: Date.now().toString(),
          text,
          createdAt: new Date().toISOString(),
          audioBlobUrl: blobUrl
        });
        return;
      }

      // JSON response (local server mode with audioUrl or error)
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        if (data.isBillingIssue) {
          billingBanner.classList.remove('hidden');
          billingBanner.scrollIntoView({ behavior: 'smooth' });
        }
        const error = new Error('Generation request failed');
        error.displayCode = errorCodeForResponse(res.status, data);
        throw error;
      }

      // JSON success
      billingBanner.classList.add('hidden');
      const item = data.item;
      if (!item || !item.audioUrl) {
        const error = new Error('Unexpected generation response');
        error.displayCode = 'RV-008';
        throw error;
      }
      loadAudioResult(item.audioUrl);
      audioElement.play().catch(() => {});
      btnPlayPause.textContent = '⏸';

      saveToHistory({
        id: item.id || Date.now().toString(),
        text: item.text,
        createdAt: item.createdAt || new Date().toISOString(),
        audioUrl: item.audioUrl
      });
    } catch (err) {
      console.warn('Сбой генерации:', err);
      showGenerationError(err.displayCode || (err instanceof TypeError ? 'RV-002' : 'RV-008'));
    } finally {
      setGenerating(false);
    }
  });

  function setGenerating(isGen) {
    if (isGen) {
      btnGenerate.disabled = true;
      genSpinner.classList.remove('hidden');
      btnGenerate.querySelector('.btn-text').textContent = currentLanguage === 'en' ? 'Generating...' : 'Генерация...';
    } else {
      btnGenerate.disabled = false;
      genSpinner.classList.add('hidden');
      btnGenerate.querySelector('.btn-text').textContent = currentLanguage === 'en' ? 'Generate speech' : 'Сгенерировать речь';
    }
  }

  // Прямой запрос к ElevenLabs для статического режима (GitHub Pages).
  // Ответ приводим к тому же виду, что и ответ своего сервера,
  // чтобы дальше код обработки был общим.
  async function requestElevenLabs(payload) {
    const cfg = window.ROCKY_CONFIG || {};
    const voiceId = payload.voiceId || cfg.defaultVoiceId;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${encodeURIComponent(payload.outputFormat)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': cfg.elevenlabsKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: payload.text,
        model_id: payload.modelId,
        voice_settings: {
          stability: payload.stability,
          similarity_boost: payload.similarityBoost,
          ...(payload.modelId === 'eleven_v4' ? {} : { style: payload.style, speed: payload.speed, use_speaker_boost: true })
        }
      })
    });

    if (res.ok) return res;

    const errData = await res.json().catch(() => ({}));
    const detail = errData.detail || {};
    const isBillingIssue = detail.status === 'payment_issue' || detail.code === 'payment_issue';
    let message = 'Произошла ошибка при генерации аудио.';
    if (isBillingIssue) {
      message = 'Подписка закончилась. Обратитесь к аккаунт-менеджеру, чтобы продлить.';
    } else if (detail.status === 'missing_permissions') {
      message = 'Недостаточно прав для генерации голоса. Обратитесь к аккаунт-менеджеру.';
    } else if (detail.message) {
      message = detail.message;
    }

    return new Response(JSON.stringify({ success: false, error: message, isBillingIssue, code: detail.status || detail.code }), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 8. Tabs Handling
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // 9. History
  function saveToHistory(item) {
    localHistory.unshift(item);
    if (localHistory.length > 30) localHistory.pop();
    try {
      // Don't store blob URLs in localStorage, just text and date
      const storable = localHistory.map(h => ({
        id: h.id,
        text: h.text,
        createdAt: h.createdAt,
        audioUrl: h.audioUrl || null
      }));
      localStorage.setItem('rocky_voice_history', JSON.stringify(storable));
    } catch (e) {}
    renderLocalHistory();
  }

  function renderLocalHistory() {
    historyCount.textContent = localHistory.length;

    if (!localHistory || localHistory.length === 0) {
      historyEmpty.classList.remove('hidden');
      historyList.innerHTML = '';
      return;
    }

    historyEmpty.classList.add('hidden');
    historyList.innerHTML = '';

    localHistory.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-card';
      const dateStr = new Date(item.createdAt).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });

      card.innerHTML = `
        <div class="history-top">
          <span class="history-time">📅 ${dateStr}</span>
          <button class="btn-history-delete" title="Удалить запись">✕</button>
        </div>
        <div class="history-text">${escapeHtml(item.text)}</div>
        <div class="history-actions">
          <button class="btn-history-reuse" title="Вставить текст в поле ввода">${currentLanguage === 'en' ? 'Edit text' : 'В редактор'}</button>
          ${item.audioUrl || item.audioBlobUrl ? `<button class="btn-history-play">▶ ${currentLanguage === 'en' ? 'Play' : 'Слушать'}</button>` : ''}
        </div>
      `;

      if (card.querySelector('.btn-history-play')) {
        card.querySelector('.btn-history-play').addEventListener('click', () => {
          loadAudioResult(item.audioBlobUrl || item.audioUrl);
          audioElement.play().catch(() => {});
          btnPlayPause.textContent = '⏸';
        });
      }

      card.querySelector('.btn-history-reuse').addEventListener('click', () => {
        scriptInput.value = item.text;
        updateCharCount();
        scriptInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      card.querySelector('.btn-history-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        localHistory = localHistory.filter(h => h.id !== item.id);
        try {
          localStorage.setItem('rocky_voice_history', JSON.stringify(localHistory));
        } catch (err) {}
        renderLocalHistory();
      });

      historyList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Start
  init();
});
