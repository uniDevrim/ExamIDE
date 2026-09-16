let currentQuestion = 0;
let currentLanguage = 'python';
let userCode = {};  // { questionId_lang: code }
const questions = []; // Sorular API'den yüklenecek
let currentExamId = 'exam_001';

let examTimeSeconds = 90 * 60; // 90 minutes
let timerInterval = null;
let monacoEditor = null;
// Sistem renk tercihini al, fallback: dark
const _sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
let currentTheme = _sysDark ? 'dark' : 'light';
// Hemen uygula (flash önlemek için script sırasında)
document.documentElement.setAttribute('data-theme', currentTheme);

// Language mapping for Monaco
const monacoLanguageMap = {
    'python': 'python',
    'cpp': 'cpp',
    'csharp': 'csharp'
};

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Tema ikonunu başlangıçta doğru ayarla
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = currentTheme === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    }

    setupResizer();
    setupOutputPanel();
    initMonacoEditor();

    // Sistem tema değişikliğini dinle (kullanıcı OS'tan geçiş yaparsa)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (currentTheme !== (e.matches ? 'dark' : 'light')) {
            toggleTheme();
        }
    });

    // Language selector
    document.getElementById('languageSelect').addEventListener('change', (e) => {
        saveCurrentCode();
        currentLanguage = e.target.value;
        loadCodeForCurrentQuestion();
    });

    // Başlatıcı: önce polling ile soru verisi gelsin
    startStatusPolling();

    // Kopyalama, kesme ve yapıştırma işlemlerini engelle
    const preventAction = (e, msg) => {
        e.preventDefault();
        showToast(msg, 'error');
    };
    document.addEventListener('copy', (e) => preventAction(e, '⚠️ Kopyalama engellenmiştir!'));
    document.addEventListener('cut', (e) => preventAction(e, '⚠️ Kesme engellenmiştir!'));
    document.addEventListener('paste', (e) => preventAction(e, '⚠️ Yapıştırma engellenmiştir!'));
});

// ========================================
// Monaco Editor
// ========================================
function initMonacoEditor() {
    require.config({
        paths: {
            'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
        }
    });

    // Disable web workers (needed for file:// protocol and cross-origin)
    window.MonacoEnvironment = {
        getWorkerUrl: function () {
            return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                self.MonacoEnvironment = { baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/' };
                importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/base/worker/workerMain.js');
            `)}`;
        }
    };

    require(['vs/editor/editor.main'], function () {
        const q = questions && questions.length > 0 ? questions[currentQuestion] : null;
        const startCode = q && q.starterCode ? (q.starterCode[currentLanguage] || '') : '';

        monacoEditor = monaco.editor.create(document.getElementById('monacoEditorContainer'), {
            value: startCode,
            language: monacoLanguageMap[currentLanguage],
            theme: currentTheme === 'dark' ? 'vs-dark' : 'vs',
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'off',
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            bracketPairColorization: { enabled: true },
            guides: {
                indentation: true,
                bracketPairs: true
            },
            suggest: {
                showKeywords: true,
                showSnippets: true
            }
        });

        // Sadece sorular yüklüyse ilk soruyu göster (aksi halde _loadQuestionsFromApi halledecek)
        if (q) {
            loadQuestion(0);
        }
    });
}

function getMonacoTheme() {
    return currentTheme === 'dark' ? 'vs-dark' : 'vs';
}

// ========================================
// Theme Toggle
// ========================================
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Update icon
    const icon = document.getElementById('themeIcon');
    if (currentTheme === 'dark') {
        icon.className = 'bi bi-moon-fill';
    } else {
        icon.className = 'bi bi-sun-fill';
    }

    // Update Monaco theme
    if (monacoEditor) {
        monaco.editor.setTheme(getMonacoTheme());
    }

    showToast(currentTheme === 'dark' ? '🌙 Koyu tema aktif' : '☀️ Açık tema aktif', 'info');
}

// ========================================
// Tab System
// ========================================
function initializeTabs() {
    const tabsContainer = document.getElementById('questionTabs');
    tabsContainer.innerHTML = '';

    questions.forEach((q, index) => {
        const tab = document.createElement('button');
        tab.className = 'question-tab' + (index === 0 ? ' active' : '');
        tab.id = `tab-${index}`;
        tab.innerHTML = `${q.id}`;
        tab.title = `Soru ${q.id}: ${q.title}`;
        tab.addEventListener('click', () => switchToQuestion(index));
        tabsContainer.appendChild(tab);
    });

    updateProgressDots();
}

function switchToQuestion(index) {
    if (index === currentQuestion) return;

    saveCurrentCode();

    // Update tabs
    document.querySelectorAll('.question-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${index}`).classList.add('active');

    currentQuestion = index;
    loadQuestion(index);
    updateNavButtons();
    updateProgressDots();
}

// ========================================
// Question Loading
// ========================================
function loadQuestion(index) {
    const q = questions[index];
    if (!q) return;

    // Header
    document.getElementById('questionTitle').innerHTML = `
        <span class="question-number">Soru ${q.id}</span>
        ${q.title}
        <span class="difficulty-badge difficulty-${q.difficulty}">
            ${q.difficulty === 'easy' ? 'Kolay' : q.difficulty === 'medium' ? 'Orta' : 'Zor'}
        </span>
    `;

    document.getElementById('questionMeta').innerHTML = `
        <span><i class="bi bi-tag"></i> ${q.category || 'Fonksiyon'}</span>
        <span><i class="bi bi-star"></i> ${q.points} Puan</span>
    `;

    // Body
    let bodyHTML = `<p>${q.description}</p>`;

    // Fonksiyon imzası (eğer fonksiyon tabanlı bir soruysa)
    if (q.functionName) {
        const paramStr = (q.parameters || []).map(p => `${p.name}: ${p.type || 'any'}`).join(', ');
        const sig = `${q.functionName}(${paramStr}) -> ${q.returnType || 'void'}`;
        bodyHTML += `
            <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 8px; padding: 10px 14px; margin: 15px 0;">
                <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 600; margin-bottom: 4px;">
                    <i class="bi bi-code-square"></i> Beklenen Fonksiyon İmzası
                </div>
                <div style="font-family: monospace; font-size: 0.9rem; color: var(--accent-primary, #6366f1); font-weight: 600;">
                    <code>${sig}</code>
                </div>
            </div>
        `;
    }

    // Examples
    q.examples.forEach((ex, i) => {
        bodyHTML += `
            <div class="example-block">
                <div class="example-label">Örnek ${i + 1}</div>
                <div class="example-content">
                    <div><span class="input-label">${q.functionName ? 'Parametreler:' : 'Girdi:'}</span> <code>${ex.input}</code></div>
                    <div><span class="output-label">${q.functionName ? 'Dönüş Değeri:' : 'Çıktı:'}</span> <code>${ex.output}</code></div>
                    ${ex.explanation ? `<div class="explanation">Açıklama: ${ex.explanation}</div>` : ''}
                </div>
            </div>
        `;
    });

    // Gizli test senaryosu uyarısı
    if (q.hiddenTests > 0) {
        bodyHTML += `
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 10px 14px; margin: 15px 0; font-size: 0.82rem; color: #f59e0b; display: flex; align-items: center; gap: 8px;">
                <i class="bi bi-lock-fill" style="font-size: 1.1rem;"></i>
                <div>
                    Bu soruda <strong>${q.hiddenTests} adet gizli test senaryosu</strong> daha bulunmaktadır. "Test Et" butonu sadece yukarıdaki örnek senaryoları çalıştırır; tüm testler sınav gönderildiğinde değerlendirilir.
                </div>
            </div>
        `;
    }

    // Constraints
    bodyHTML += `
        <div class="constraints-section">
            <h5><i class="bi bi-exclamation-circle"></i> Kısıtlamalar</h5>
            <ul class="constraints-list">
                ${q.constraints.map(c => `<li>${c}</li>`).join('')}
            </ul>
        </div>
    `;

    document.getElementById('questionBody').innerHTML = bodyHTML;

    // Load code into Monaco
    loadCodeForCurrentQuestion();

    // Update nav buttons
    updateNavButtons();

    // Clear output
    const outputBody = document.getElementById('outputBody');
    outputBody.className = 'output-body';
    outputBody.textContent = 'Henüz çıktı yok. Kodunuzu test edin veya çalıştırın.';
}

function loadCodeForCurrentQuestion() {
    const q = questions[currentQuestion];
    const key = `${q.id}_${currentLanguage}`;
    const code = userCode[key] || q.starterCode[currentLanguage] || '';

    if (monacoEditor) {
        // Set the language model
        const model = monacoEditor.getModel();
        monaco.editor.setModelLanguage(model, monacoLanguageMap[currentLanguage]);

        // Set value
        monacoEditor.setValue(code);
    }
}

function saveCurrentCode() {
    const q = questions[currentQuestion];
    const key = `${q.id}_${currentLanguage}`;
    if (monacoEditor) {
        userCode[key] = monacoEditor.getValue();
    }
}

// ========================================
// Panel Resizer
// ========================================
function setupResizer() {
    const resizer = document.getElementById('panelResizer');
    const leftPanel = document.querySelector('.question-panel');
    const rightPanel = document.querySelector('.editor-panel');
    const container = document.querySelector('.main-content');

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizer.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const containerRect = container.getBoundingClientRect();
        const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;

        if (percentage > 25 && percentage < 75) {
            leftPanel.style.flex = `0 0 ${percentage}%`;
            rightPanel.style.flex = `0 0 ${100 - percentage}%`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizer.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            // Trigger Monaco layout recalculation
            if (monacoEditor) {
                monacoEditor.layout();
            }
        }
    });
}

// ========================================
// Timer
// ========================================
let _examTimerStarted = false; // ilk başlatıştı mı?

function startTimer() {
    if (timerInterval) clearInterval(timerInterval); // öncekini temizle
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        examTimeSeconds--;
        updateTimerDisplay();

        if (examTimeSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            finishExam(true);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const hours = Math.floor(examTimeSeconds / 3600);
    const minutes = Math.floor((examTimeSeconds % 3600) / 60);
    const seconds = examTimeSeconds % 60;

    const timerEl = document.getElementById('examTimer');
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    document.getElementById('timerDisplay').textContent = timeStr;

    // Danger mode when less than 5 minutes
    if (examTimeSeconds <= 300) {
        timerEl.classList.add('danger');
    } else {
        timerEl.classList.remove('danger');
    }
}

// ========================================
// Output Panel
// ========================================
function setupOutputPanel() {
    const header = document.querySelector('.output-header');
    const panel = document.querySelector('.output-panel');

    header.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
    });
}

// ========================================
// Run & Submit
// ========================================
function testCode(event) {
    if (event) event.preventDefault();

    const q = questions[currentQuestion];
    if (!q) return;

    const code = monacoEditor.getValue();
    const language = currentLanguage || document.getElementById('languageSelect').value.toLowerCase();
    const outputElement = document.getElementById('outputBody');
    const panel = document.querySelector('.output-panel');
    const btn = document.getElementById('btnRunCode') || document.querySelector('.btn-run');

    panel.classList.remove('collapsed');
    outputElement.className = 'output-body';
    outputElement.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; color:var(--text-muted); padding: 8px;">
            <div class="spinner-border spinner-border-sm" role="status"></div>
            <span>Kod derleniyor ve test senaryoları çalıştırılıyor...</span>
        </div>
    `;

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Çalıştırılıyor...';
    }

    // Açık olan test senaryolarını backend /api/client/test endpoint'inde çalıştır
    fetch('/api/client/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code: code,
            language: language,
            question_id: q.id.toString()
        })
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => { throw new Error(err.error || "Sunucu hatası"); });
        }
        return res.json();
    })
    .then(data => {
        renderTestResults(data);
    })
    .catch(err => {
        outputElement.innerHTML = `
            <div style="color:var(--accent-danger, #ef4444); padding: 8px;">
                <i class="bi bi-exclamation-octagon-fill"></i> <strong>Hata:</strong> ${err.message}
            </div>
        `;
    })
    .finally(() => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-play-fill"></i> Çalıştır';
        }
    });
}

// "Çalıştır" butonu test senaryolarını koşturan testCode fonksiyonunu tetikler
function runCode(event) {
    testCode(event);
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderTestResults(data) {
    const outputElement = document.getElementById('outputBody');
    const results = data.results || [];
    const passedCount = data.passed_count ?? 0;
    const hiddenCount = data.hidden_count ?? 0;

    if (results.length === 0) {
        outputElement.innerHTML = `
            <div style="color:var(--text-muted); padding: 8px;">
                <i class="bi bi-info-circle"></i> Test senaryosu bulunamadı.
            </div>
        `;
        return;
    }

    let html = `
        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
            <div style="font-weight: 600; font-size: 0.95rem; color: ${passedCount === results.length && results.length > 0 ? 'var(--accent-success, #22c55e)' : 'var(--accent-danger, #ef4444)'};">
                <i class="bi ${passedCount === results.length && results.length > 0 ? 'bi-check-all' : 'bi-x-circle'}"></i> 
                ${passedCount}/${results.length} Açık Test Başarılı
            </div>
            ${hiddenCount > 0 ? `
                <div style="font-size: 0.8rem; color: #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 2px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px;">
                    <i class="bi bi-lock-fill"></i> ${hiddenCount} Gizli Test
                </div>
            ` : ''}
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
    `;

    results.forEach((r, idx) => {
        const passed = r.passed === true;
        const color = passed ? 'var(--accent-success, #22c55e)' : 'var(--accent-danger, #ef4444)';
        const icon = passed ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
        const badgeBg = passed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
        const expStr = r.expected !== undefined ? escapeHtml(JSON.stringify(r.expected)) : '';
        const actStr = r.actual !== undefined && r.actual !== null ? escapeHtml(JSON.stringify(r.actual)) : '';

        let badgeText = 'Başarılı';
        if (!passed) {
            if (r.error_type === 'timeout') badgeText = '⏰ Zaman Aşımı';
            else if (r.error_type === 'compilation') badgeText = '⚠️ Derleme Hatası';
            else if (r.error_type === 'wrong_answer') badgeText = '❌ Hatalı Sonuç';
            else badgeText = r.error_type || 'Hata';
        }

        const hasStdout = r.stdout && r.stdout.toString().trim().length > 0;
        const stdoutBlock = hasStdout ? `
            <div class="test-stdout-box">
                <div class="test-stdout-header">
                    <i class="bi bi-terminal"></i> Konsol Çıktısı (stdout / print)
                </div>
                <pre class="test-stdout-content">${escapeHtml(r.stdout.trim())}</pre>
            </div>
        ` : '';

        html += `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-weight: 600; font-size: 0.85rem; color: ${color};">
                        <i class="bi ${icon}"></i> Test ${idx + 1}
                    </span>
                    <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; background: ${badgeBg}; color: ${color}; font-weight: 500;">
                        ${badgeText}
                    </span>
                </div>
                <div style="font-family: monospace; font-size: 0.82rem; line-height: 1.5;">
                    <div><span style="color: var(--text-muted);">Beklenen:</span> <code style="color: var(--text-primary);">${expStr}</code></div>
                    ${!passed && actStr ? `<div><span style="color: var(--accent-danger, #ef4444);">Alınan:</span> <code style="color: var(--accent-danger, #ef4444);">${actStr}</code></div>` : ''}
                    ${r.error_message ? `
                        <div style="margin-top: 4px; color: var(--accent-danger, #ef4444); font-size: 0.78rem;">
                            <i class="bi bi-info-circle"></i> ${escapeHtml(r.error_message)}
                        </div>
                    ` : ''}
                </div>
                ${stdoutBlock}
            </div>
        `;
    });

    html += '</div>';
    outputElement.innerHTML = html;
}


// ========================================
// Navigation
// ========================================
function prevQuestion() {
    if (currentQuestion > 0) {
        switchToQuestion(currentQuestion - 1);
    }
}

function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        switchToQuestion(currentQuestion + 1);
    }
}

function updateNavButtons() {
    const prevBtn = document.getElementById('btnPrev');
    const nextBtn = document.getElementById('btnNext');

    prevBtn.disabled = currentQuestion === 0;
    nextBtn.disabled = currentQuestion === questions.length - 1;
}




function updateProgressDots() {
    const dotsContainer = document.getElementById('progressDots');
    dotsContainer.innerHTML = '';

    questions.forEach((q, i) => {
        const dot = document.createElement('div');
        dot.className = 'progress-dot';
        if (i === currentQuestion) dot.classList.add('active');
        dotsContainer.appendChild(dot);
    });

    document.getElementById('progressText').textContent = `${questions.length} Soru`;
}

// ========================================
// Exam Finish
// ========================================
function showFinishModal() {
    const summaryEl = document.getElementById('examSummary');
    
    let summaryHTML = '<div style="margin-bottom: 15px; color: var(--text-secondary);">Cevaplarınız kaydedildi. Sınavı bitirmek istediğinize emin misiniz?</div>';
    questions.forEach(q => {
        summaryHTML += `
            <div class="exam-summary-item">
                <span class="label">Soru ${q.id}: ${q.title}</span>
                <span class="value success">Kaydedildi</span>
            </div>
        `;
    });

    summaryEl.innerHTML = summaryHTML;

    const modal = new bootstrap.Modal(document.getElementById('finishModal'));
    modal.show();
}

function confirmFinishExam() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('finishModal'));
    modal.hide();

    saveCurrentCode();

    // Build all questions payload
    const questionsPayload = questions.map(q => ({
        question_id: `q${q.id}`,
        code: userCode[`${q.id}_${currentLanguage}`] || q.starterCode[currentLanguage] || ''
    }));

    showToast('⏳ Sınav gönderiliyor...', 'info');

    fetch('/api/client/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            exam_id: currentExamId,
            student_id: STUDENT_ID,
            language: currentLanguage,
            questions: questionsPayload
        })
    })
        .then(r => r.json())
        .then(data => {
            if (data.message === 'Submitted successfully') {
                const passed = data.passed_tests !== undefined ? data.passed_tests : 0;
                const total = data.total_tests !== undefined ? data.total_tests : 0;
                showToast(`✅ Sınavınız gönderildi — ${passed}/${total} test başarılı!`, 'success');
                finishExam(false);
            } else if (data.error === 'Already submitted') {
                showToast('⚠️ Bu sınav zaten gönderilmiş.', 'error');
            } else {
                showToast('❌ Hata: ' + (data.error || 'Bilinmeyen hata'), 'error');
            }
        })
        .catch(() => {
            showToast('❌ Sunucuya bağlanılamadı.', 'error');
        });
}

function finishExam(timeUp) {
    clearInterval(timerInterval);
    saveCurrentCode();

    // Disable Monaco
    if (monacoEditor) {
        monacoEditor.updateOptions({ readOnly: true });
    }

    document.querySelectorAll('.question-tab').forEach(t => t.style.pointerEvents = 'none');
    document.querySelector('.btn-finish-exam').disabled = true;

    if (timeUp) {
        showToast('⏰ Süre doldu! Cevaplarınız otomatik olarak gönderiliyor...', 'info');
        // Auto-submit when time is up
        _autoSubmitOnTimeUp();
    } else {
        showToast('✅ Sınav başarıyla tamamlandı!', 'success');
    }

    _showFinishedOverlay();
}

function _autoSubmitOnTimeUp() {
    const questionsPayload = questions.map(q => ({
        question_id: `q${q.id}`,
        code: userCode[`${q.id}_${currentLanguage}`] || q.starterCode[currentLanguage] || ''
    }));

    fetch('/api/client/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            exam_id: currentExamId,
            student_id: STUDENT_ID,
            language: currentLanguage,
            questions: questionsPayload
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.message === 'Submitted successfully') {
            showToast('✅ Süre doldu — cevaplarınız gönderildi.', 'success');
        } else if (data.error === 'Already submitted') {
            // Zaten gönderilmiş, sorun yok
        } else {
            showToast('⚠️ Otomatik gönderim hatası: ' + (data.error || ''), 'error');
        }
    })
    .catch(() => {
        showToast('⚠️ Sunucuya bağlanılamadı, kodlarınız TimeMachine ile korunmaktadır.', 'error');
    });
}

function _showFinishedOverlay() {
    setTimeout(() => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); display: flex; align-items: center;
            justify-content: center; z-index: 9999; backdrop-filter: blur(8px);
        `;
        overlay.innerHTML = `
            <div style="text-align: center; color: white;">
                <div style="font-size: 4rem; margin-bottom: 16px;">📝</div>
                <h2 style="font-size: 1.8rem; margin-bottom: 8px;">Sınav Tamamlandı</h2>
                <p style="color: #a1a1aa; margin-bottom: 24px;">Cevaplarınız başarıyla sisteme gönderildi.</p>
                <div style="margin-top: 16px; color: #71717a; font-size: 0.85rem;">
                    Çıkış yapabilirsiniz.
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }, 500);
}

// ========================================
// Toast Notifications
// ========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;

    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'x-circle';

    toast.innerHTML = `
        <i class="bi bi-${icon}" style="font-size: 1.1rem; color: var(--accent-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'});"></i>
        <span style="font-size: 0.85rem; color: var(--text-primary);">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

let _lastExamState = null;   // önceki state (ilk yüklemeyi tetiklemek için)
let _questionsLoaded = false;  // sorular bir kez yüklenince false'a dönmesin
let _pollingInterval = null;

/**
 * Her 3 saniyede bir /api/client/exam/status'a istek atar.
 * State değiştikçe UI'yi günceller.
*/

function startStatusPolling() {
    doPoll();                           // hemen ilk istek
    _pollingInterval = setInterval(doPoll, 3000);
}

async function doPoll() {
    try {
        const res = await fetch('/api/client/exam/status');
        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }
        if (!res.ok) return;
        const status = await res.json();
        handleExamStatus(status);
    } catch (e) {
        // ağ hatası — sessizce geç
    }
}

/**
 * API yanıtını işler ve UI durumunu güncelller.
 * @param {Object} status - { state, exam, questions, started_at }
 */
function handleExamStatus(status) {
    const state = status.state;         // idle | running | paused | ended
    const examData = status.exam || {};
    if (examData.exam_id) {
        currentExamId = examData.exam_id;
    }
    const questions_api = status.questions || {};

    const stateChanged = (state !== _lastExamState);
    _lastExamState = state;

    // ─── Overlay kontrolü ───────────────────────────────────────────
    const overlays = {
        waiting: document.getElementById('overlayWaiting'),
        paused: document.getElementById('overlayPaused'),
        ended: document.getElementById('overlayEnded'),
    };

    // Tümünü kapat, sonra doğrusunu aç
    Object.values(overlays).forEach(el => el && el.classList.remove('active'));

    if (state === 'idle') {
        overlays.waiting && overlays.waiting.classList.add('active');
        _setEditorReadOnly(true);
    } else if (state === 'paused') {
        overlays.paused && overlays.paused.classList.add('active');
        _setEditorReadOnly(true);
    } else if (state === 'ended') {
        overlays.ended && overlays.ended.classList.add('active');
        _setEditorReadOnly(true);
        clearInterval(_pollingInterval); // artık poll etmeye gerek yok
        // Admin sınavı bitirdi — henüz gönderilmediyse otomatik gönder
        if (stateChanged && _questionsLoaded) {
            saveCurrentCode();
            _autoSubmitOnTimeUp();
        }
    } else if (state === 'running') {
        // Tüm overlay'ler kapatıldı, editörü aç
        _setEditorReadOnly(false);
    }

    // ─── Soruları yükle (yalnızca ilk kez, running durumunda) ────────
    if (state === 'running' && !_questionsLoaded) {
        const qKeys = Object.keys(questions_api);
        if (qKeys.length > 0) {
            _loadQuestionsFromApi(questions_api, examData);
            _questionsLoaded = true;
        }
    }

    // ─── Timer: API'dan gelen kalan süreyi kullan ───────────────────
    const remainingSecs = (typeof status.remaining_seconds === 'number' && status.remaining_seconds >= 0)
        ? Math.round(status.remaining_seconds)
        : null;

    if (state === 'idle') {
        // Sınav başlamadı: JSON'daki tam süreyi göster, saydırma
        if (remainingSecs === null && examData.time) {
            examTimeSeconds = _parseTimeSecs(examData.time);
        } else if (remainingSecs !== null) {
            examTimeSeconds = remainingSecs;
        }
        if (!timerInterval) updateTimerDisplay();
    }

    if (state === 'running') {
        // Her poll'da kalan süreyi senkronize et (sayfa yenileme de dahil)
        if (remainingSecs !== null) {
            examTimeSeconds = remainingSecs;
        }
        // Sayaç çalışmıyorsa başlat
        if (!timerInterval) {
            _examTimerStarted = true;
            startTimer();
        }
    }

    // paused olunca saydırmayı durdur, kalan süreyi ekranda dondur
    if (state === 'paused') {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        // Kalan süreyi doğru göster
        if (remainingSecs !== null) {
            examTimeSeconds = remainingSecs;
            updateTimerDisplay();
        }
    }

    if (state === 'ended' && timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/** time alanını saniyeye çevirir. '90' => 5400, '01:30:00' => 5400 */
function _parseTimeSecs(time) {
    if (!time) return 0;
    const s = String(time).trim();
    if (s.includes(':')) {
        const parts = s.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
    }
    const n = parseInt(s, 10);
    return isNaN(n) ? 0 : n * 60; // düzce sayı ise dakika kabul et
}

/** Editörü read-only veya yazılabilir yapar */
function _setEditorReadOnly(readonly) {
    if (monacoEditor) {
        monacoEditor.updateOptions({ readOnly: readonly });
    }
}

/**
 * API'dan gelen soruları yerel `questions` dizisine çevirir
 * ve mevcut soru sistemini çalıştırır.
 */
function _loadQuestionsFromApi(questionsObj, examData) {
    // Dil: API'dan gelen language alanı
    const lang = (examData.language || 'python').toLowerCase();
    if (['python', 'cpp', 'csharp'].includes(lang)) {
        currentLanguage = lang;
        const sel = document.getElementById('languageSelect');
        if (sel) {
            sel.value = currentLanguage;
            sel.disabled = true; // Sınav dili kilitli — öğrenci değiştiremez
            sel.title = 'Sınav dili: ' + lang.toUpperCase();
        }
    }

    // soruları yeniden oluştur
    questions.length = 0;  // dizini temizle
    Object.keys(questionsObj).forEach((key, idx) => {
        const q = questionsObj[key];
        const funcName = q.function_name || '';
        const parameters = q.parameters || [];
        const returnType = q.return_type || '';
        const visibleTests = q['test-cases'] || [];
        const totalTests = q.total_tests !== undefined ? q.total_tests : visibleTests.length;
        const hiddenTests = Math.max(0, totalTests - visibleTests.length);

        const examples = visibleTests.map((tc, i) => {
            let inVal = tc.input;
            if (typeof inVal === 'object' && inVal !== null) {
                inVal = JSON.stringify(inVal);
            }
            let outVal = tc.expected !== undefined ? tc.expected : tc.output;
            if (typeof outVal === 'object' && outVal !== null) {
                outVal = JSON.stringify(outVal);
            }
            return {
                input: inVal !== undefined ? inVal : '',
                output: outVal !== undefined ? outVal : '',
                explanation: ''
            };
        });

        // Starter code: Eğer fonksiyon adı tanımlıysa generateStarterCode üret, yoksa eski şablon
        let pyStarter = funcName ? generateStarterCode('python', funcName, parameters, returnType) : '# Kodunuzu buraya yazın\n';
        let cppStarter = funcName ? generateStarterCode('cpp', funcName, parameters, returnType) : '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Kodunuzu buraya yazın\n    return 0;\n}\n';
        let csStarter = funcName ? generateStarterCode('csharp', funcName, parameters, returnType) : 'using System;\n\npublic class Solution {\n    // Kodunuzu buraya yazın\n}\n';

        if (q['starter-code'] || q['starter_code']) {
            const sc = q['starter-code'] || q['starter_code'];
            if (typeof sc === 'string') {
                pyStarter = sc; cppStarter = sc; csStarter = sc;
            } else if (typeof sc === 'object') {
                if (sc.python) pyStarter = sc.python;
                if (sc.cpp) cppStarter = sc.cpp;
                if (sc.csharp) csStarter = sc.csharp;
            }
        }

        questions.push({
            id: parseInt(key, 10) || (idx + 1),
            title: q.title || `Soru ${key}`,
            difficulty: 'medium',
            points: q.points || 0,
            category: funcName ? 'Fonksiyon' : '',
            description: q.description || '',
            functionName: funcName,
            parameters: parameters,
            returnType: returnType,
            totalTests: totalTests,
            hiddenTests: hiddenTests,
            examples,
            constraints: [
                `Çalışma süresi sınırı: ${q['run-time-limit']} saniye`,
                `Bellek sınırı: ${q['memory-limit']} MB`,
            ],
            starterCode: {
                python: pyStarter,
                cpp: cppStarter,
                csharp: csStarter
            }
        });
    });

    // Tab + soru panelini güncelle
    currentQuestion = 0;
    initializeTabs();
    loadQuestion(0);

    // TimeMachine: sorular yüklendikten sonra öğrenci kodlarını restore et
    restoreCodesFromTimeMachine();
    // TimeMachine: autosave başlat
    startTimeMachineAutosave();
}


// ========================================
// TimeMachine — Autosave & Restore
// ========================================

let _autosaveInterval = null;

/**
 * Her 10 saniyede bir aktif sorudaki kodu backend'e kaydeder.
 * trigger = 'autosave'
 */
function startTimeMachineAutosave() {
    if (_autosaveInterval) return; // zaten çalışıyor
    _autosaveInterval = setInterval(() => {
        if (!monacoEditor) return;
        const code = monacoEditor.getValue();
        if (!code || !code.trim()) return;

        const q = questions[currentQuestion];
        if (!q) return;

        const qId = `q${q.id}`;
        const lang = currentLanguage;

        fetch('/api/client/save_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question_id: qId,
                code: code,
                language: lang
            })
        }).catch(() => {
            // ağ hatasında sessizce geç, kullanıcıyı rahatsız etme
        });
    }, 10000); // 10 saniye
}

/**
 * Backend'deki son kaydedilmiş kodları getirir ve userCode map'ini doldurur.
 * Sayfa yenilemesinden veya elektrik kesintisinden sonra editörü restore eder.
 */
async function restoreCodesFromTimeMachine() {
    try {
        const res = await fetch('/api/client/my_codes');
        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }
        if (!res.ok) return;
        const codesMap = await res.json(); // { "q1": { code, lang, saved_at }, ... }

        let restoredCount = 0;
        Object.entries(codesMap).forEach(([qId, snap]) => {
            // qId = "q1" → numeric id = 1
            const numId = parseInt(qId.replace('q', ''), 10);
            const lang = snap.lang || currentLanguage;
            const key = `${numId}_${lang}`;
            userCode[key] = snap.code;
            restoredCount++;
        });

        if (restoredCount > 0) {
            // Aktif soruyu yeniden yükle (editoru restore edilmiş kodla aç)
            loadCodeForCurrentQuestion();
            showToast(`⏱️ ${restoredCount} sorudaki kodlar geri yüklendi`, 'info');
            console.log('[TimeMachine] Restore tamamlandı:', restoredCount, 'soru');
        }
    } catch (e) {
        console.warn('[TimeMachine] Restore hatası:', e);
    }
}

// ========================================
// Starter Code Generator
// ========================================
function generateStarterCode(lang, functionName, parameters = [], returnType = '') {
    const l = (lang || 'python').toLowerCase().trim();
    if (l === 'python' || l === 'py') {
        const params = parameters.map((p, i) => p.name || `param${i}`).join(', ');
        const ret = returnType ? ` -> ${returnType}` : '';
        return `def ${functionName}(${params})${ret}:\n    # Kodunuzu buraya yazın\n    pass\n`;
    } else if (l === 'cpp' || l === 'c++') {
        const ret = returnType || 'void';
        const params = parameters.map((p, i) => `${p.type || 'int'} ${p.name || `param${i}`}`).join(', ');
        return `#include <iostream>\n#include <vector>\n#include <string>\n\n${ret} ${functionName}(${params}) {\n    // Kodunuzu buraya yazın\n}\n`;
    } else if (l === 'csharp' || l === 'c#' || l === 'cs') {
        const ret = returnType || 'void';
        const params = parameters.map((p, i) => `${p.type || 'int'} ${p.name || `param${i}`}`).join(', ');
        return `using System;\nusing System.Collections.Generic;\n\npublic class Solution\n{\n    public static ${ret} ${functionName}(${params})\n    {\n        // Kodunuzu buraya yazın\n    }\n}\n`;
    }
    return '';
}
