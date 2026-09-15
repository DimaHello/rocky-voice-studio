document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const scriptInput = document.getElementById('scriptInput');
  const charCount = document.getElementById('charCount');
  const btnClearText = document.getElementById('btnClearText');
  const btnGenerate = document.getElementById('btnGenerate');
  const genSpinner = document.getElementById('genSpinner');
  const billingBanner = document.getElementById('billingBanner');

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
    model: 'eleven_v3',
    voice: '9v8bxagMX43JiaF92sqe',
    preset: 'standard'
  };

  let localHistory = [];
  try {
    localHistory = JSON.parse(localStorage.getItem('rocky_voice_history') || '[]');
  } catch (e) {
    localHistory = [];
  }

  // 1. Initial Config Fetch & Local History
  async function init() {
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
    renderLocalHistory();
  }

  // 2. Preset dropdown handler
  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      const id = presetSelect.value;
      const preset = presetsMap[id];
      if (!preset) return;

      if (presetDesc) {
        presetDesc.textContent = preset.description || '';
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
      presetDesc.textContent = presetsMap['standard'].description;
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
    voiceSelect.value = DEFAULT_SETTINGS.voice;
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

  // 7. Generation Trigger
  btnGenerate.addEventListener('click', async () => {
    const text = scriptInput.value.trim();
    if (!text) {
      alert('Пожалуйста, введите текст для озвучивания Лиса Рокки.');
      scriptInput.focus();
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

      const res = await fetch('/api/generate', {
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
        throw new Error(data.error || 'Произошла ошибка при генерации аудио.');
      }

      // JSON success
      billingBanner.classList.add('hidden');
      const item = data.item;
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
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  });

  function setGenerating(isGen) {
    if (isGen) {
      btnGenerate.disabled = true;
      genSpinner.classList.remove('hidden');
      btnGenerate.querySelector('.btn-text').textContent = 'Генерация...';
    } else {
      btnGenerate.disabled = false;
      genSpinner.classList.add('hidden');
      btnGenerate.querySelector('.btn-text').textContent = 'Сгенерировать речь';
    }
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
          <button class="btn-history-reuse" title="Вставить текст в поле ввода">В редактор</button>
          ${item.audioUrl || item.audioBlobUrl ? '<button class="btn-history-play">▶ Слушать</button>' : ''}
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
