/* ─────────────────────────────────────
   Live Code Viewer
───────────────────────────────────── */
let _liveCodeStudentNo   = null;
let _liveCodeInterval    = null;
let _liveCodeData        = {};   // { "q1": { code, lang, saved_at }, ... }
let _liveCodeActiveTab   = null;

/** Called by the "Canlı Kod" button in the student list row */
function openLiveCode(studentNo, fullName) {
    _liveCodeStudentNo = studentNo;
    _liveCodeData      = {};
    _liveCodeActiveTab = null;

    document.getElementById('liveCodeModalTitle').innerHTML =
        '<i class="bi bi-eye-fill" style="color: var(--accent-primary);"></i> Canlı Kod İzleme';
    document.getElementById('liveCodeModalSubtitle').textContent =
        `${fullName}  ·  ${studentNo}`;
    document.getElementById('liveCodeContent').value = '';
    document.getElementById('liveCodeSavedAt').textContent = '—';
    document.getElementById('liveCodeTabs').innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem;padding:8px 4px;">Yükleniyor...</span>';

    const modal = new bootstrap.Modal(document.getElementById('liveCodeModal'));
    modal.show();

    // Start polling
    refreshLiveCode();
    _liveCodeInterval = setInterval(refreshLiveCode, 5000);
}

function stopLiveCodePoll() {
    if (_liveCodeInterval) {
        clearInterval(_liveCodeInterval);
        _liveCodeInterval = null;
    }
}

// Also stop when the modal is hidden via Bootstrap backdrop/button
document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('liveCodeModal');
    if (el) {
        el.addEventListener('hidden.bs.modal', stopLiveCodePoll);
    }
});

async function refreshLiveCode() {
    if (!_liveCodeStudentNo) return;
    try {
        const res = await fetch(`/api/admin/student/${encodeURIComponent(_liveCodeStudentNo)}/live_code`);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        _liveCodeData = data;
        _renderLiveCodeTabs();
    } catch (err) {
        console.warn('[LiveCode] fetch error:', err);
    }
}

function _renderLiveCodeTabs() {
    const tabsEl = document.getElementById('liveCodeTabs');
    const keys   = Object.keys(_liveCodeData).sort();

    if (keys.length === 0) {
        tabsEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem;padding:8px 4px;">Henüz kayıt yok.</span>';
        document.getElementById('liveCodeContent').value = '';
        return;
    }

    // Pick initial tab
    if (!_liveCodeActiveTab || !_liveCodeData[_liveCodeActiveTab]) {
        _liveCodeActiveTab = keys[0];
    }

    // Rebuild tabs
    tabsEl.innerHTML = keys.map(k => {
        const active = k === _liveCodeActiveTab ? 'active' : '';
        const label  = k.startsWith('q') ? `Soru ${k.slice(1)}` : k;
        return `<button class="live-tab-btn ${active}" onclick="switchLiveTab('${k}')">${label}</button>`;
    }).join('');

    _showLiveCode(_liveCodeActiveTab);
}

function switchLiveTab(questionId) {
    _liveCodeActiveTab = questionId;
    _renderLiveCodeTabs();
}

function _showLiveCode(questionId) {
    const entry = _liveCodeData[questionId];
    if (!entry) return;
    document.getElementById('liveCodeContent').value = entry.code || '';
    const ts = entry.saved_at
        ? new Date(entry.saved_at).toLocaleTimeString('tr-TR')
        : '—';
    document.getElementById('liveCodeSavedAt').textContent =
        `Son kayıt: ${ts}  ·  ${entry.lang || ''}`;
}
