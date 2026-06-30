        /* ─────────────────────────────────────
           Unified Code Viewer (İzle)
           - Live code from TimeMachine snapshots (always works)
           - History slider from JSONL files (when available)
        ───────────────────────────────────── */
        let _pbStudentNo      = null;
        let _pbStudentName    = '';
        let _pbExamId         = null;
        let _pbLiveData       = {};       // { "q1": { code, lang, saved_at }, ... }
        let _pbActiveQuestion = null;
        let _pbRefreshInterval = null;

        // History slider
        let _pbHistoryData    = {};       // { "q1": [{timestamp, code}, ...], ... }
        let _pbHistoryFrames  = [];       // frames for active question
        let _pbHistoryMode    = false;    // false = live, true = history slider
        let playbackInterval  = null;     // auto-play interval

        /**
         * Called by the "İzle" button in the student list.
         */
        async function loadPlayback(studentNo, studentName) {
            _pbStudentNo   = studentNo;
            _pbStudentName = studentName || studentNo;
            _pbExamId      = _tmSessionData?.exam_id || (typeof globalExamId !== 'undefined' ? globalExamId : 'exam_001');
            _pbLiveData    = {};
            _pbHistoryData = {};
            _pbActiveQuestion = null;
            _pbHistoryMode = false;

            // Show & scroll to panel
            const panel = document.getElementById('playbackAccordion');
            panel.style.display = 'block';
            panel.classList.add('open');
            panel.scrollIntoView({ behavior: 'smooth' });

            // Set student info
            document.getElementById('playbackStudentName').textContent = _pbStudentName;
            document.getElementById('playbackStudentNo').textContent = _pbStudentNo;
            document.getElementById('playbackStatus').textContent = 'Yükleniyor...';
            document.getElementById('playbackCode').value = '';

            // Show live mode UI, hide history slider
            _pbSetLiveMode();

            // Fetch live code immediately
            await _pbFetchLiveCode();

            // Also try to fetch history (may be empty, that's ok)
            _pbFetchHistory();

            // Start auto-refresh (3 seconds)
            _pbStopRefresh();
            _pbRefreshInterval = setInterval(async () => {
                await _pbFetchLiveCode();
                if (_pbHistoryMode) {
                    await _pbFetchHistory(true);
                }
            }, 3000);
        }

        function _pbStopRefresh() {
            if (_pbRefreshInterval) {
                clearInterval(_pbRefreshInterval);
                _pbRefreshInterval = null;
            }
            if (playbackInterval) {
                clearInterval(playbackInterval);
                playbackInterval = null;
            }
        }

        // ── Live Code (from TimeMachine snapshots — always works) ──────

        async function _pbFetchLiveCode() {
            if (!_pbStudentNo) return;
            try {
                const res = await fetch(`/api/admin/student/${encodeURIComponent(_pbStudentNo)}/live_code`);
                if (!res.ok) return;
                _pbLiveData = await res.json();
                _pbRenderTabs();

                // If in live mode, update the code display
                if (!_pbHistoryMode) {
                    _pbShowLiveCode();
                }
            } catch (err) {
                console.warn('[İzle] live fetch error:', err);
            }
        }

        function _pbRenderTabs() {
            const tabsEl = document.getElementById('playbackQuestionTabs');
            // Combine keys from live data and history data
            const allKeys = new Set([
                ...Object.keys(_pbLiveData),
                ...Object.keys(_pbHistoryData)
            ]);
            const keys = [...allKeys].sort();

            if (keys.length === 0) {
                tabsEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem;padding:4px;">Öğrenci henüz kod yazmadı.</span>';
                return;
            }

            // Pick initial tab
            if (!_pbActiveQuestion || !keys.includes(_pbActiveQuestion)) {
                _pbActiveQuestion = keys[0];
            }

            tabsEl.innerHTML = keys.map(k => {
                const active = k === _pbActiveQuestion ? 'active' : '';
                const label  = k.startsWith('q') ? `Soru ${k.slice(1)}` : k;
                return `<button class="live-tab-btn ${active}" onclick="_pbSwitchTab('${k}')">${label}</button>`;
            }).join('');
        }

        function _pbSwitchTab(questionId) {
            _pbActiveQuestion = questionId;
            _pbRenderTabs();
            if (_pbHistoryMode) {
                _pbShowHistoryForQuestion(false);
            } else {
                _pbShowLiveCode();
            }
        }

        function _pbShowLiveCode() {
            if (!_pbActiveQuestion || !_pbLiveData[_pbActiveQuestion]) {
                document.getElementById('playbackCode').value = '';
                document.getElementById('playbackStatus').textContent =
                    `${_pbStudentName} · Bu soru için henüz kod yok`;
                return;
            }
            const entry = _pbLiveData[_pbActiveQuestion];
            document.getElementById('playbackCode').value = entry.code || '';
            const ts = entry.saved_at
                ? new Date(entry.saved_at).toLocaleTimeString('tr-TR')
                : '';
            document.getElementById('playbackStatus').textContent =
                `${_pbStudentName} · Canlı · Son kayıt: ${ts}`;
        }

        // ── History (from JSONL files — for slider/playback) ──────────

        async function _pbFetchHistory(preserveCurrentFrame = false) {
            if (!_pbStudentNo || !_pbExamId) return;
            try {
                const res = await fetch(`/api/admin/playback/${encodeURIComponent(_pbExamId)}/${encodeURIComponent(_pbStudentNo)}`);
                if (!res.ok) return;
                const data = await res.json();
                _pbHistoryData = data.questions || {};
                if (_pbHistoryMode) {
                    _pbShowHistoryForQuestion(preserveCurrentFrame);
                }
                // Update tabs to include any new questions from history
                _pbRenderTabs();
            } catch (err) {
                // History not available yet — that's fine
            }
        }

        function _pbShowHistoryForQuestion(preserveCurrentFrame = false) {
            const slider = document.getElementById('playbackSlider');
            const oldVal = parseInt(slider.value) || 0;
            const oldMax = parseInt(slider.max) || 0;
            const wasAtEnd = oldVal >= oldMax;

            _pbHistoryFrames = (_pbHistoryData[_pbActiveQuestion] || []);
            const newMax = Math.max(0, _pbHistoryFrames.length - 1);
            slider.max = newMax;

            if (_pbHistoryFrames.length === 0) {
                document.getElementById('playbackCode').value = '';
                document.getElementById('playbackStatus').textContent =
                    `${_pbStudentName} · Geçmiş · Kayıt yok`;
                document.getElementById('playbackTime').textContent = '';
                return;
            }

            if (preserveCurrentFrame && !wasAtEnd) {
                slider.value = Math.min(oldVal, newMax);
            } else {
                slider.value = newMax;
            }
            onSliderInput();
        }

        function onSliderInput() {
            if (_pbHistoryFrames.length === 0) return;
            const idx = parseInt(document.getElementById('playbackSlider').value);
            const frame = _pbHistoryFrames[idx];
            if (!frame) return;
            document.getElementById('playbackCode').value = frame.code;
            document.getElementById('playbackTime').textContent =
                `${idx + 1}/${_pbHistoryFrames.length} · ${new Date(frame.timestamp).toLocaleTimeString('tr-TR')}`;
            document.getElementById('playbackStatus').textContent =
                `${_pbStudentName} · Geçmiş · ${_pbHistoryFrames.length} kayıt`;
        }

        // ── Mode switching ────────────────────────────────────────────

        function _pbSetLiveMode() {
            _pbHistoryMode = false;
            document.getElementById('playbackSliderRow').style.display = 'none';
            document.getElementById('btnModeLive').classList.add('active');
            document.getElementById('btnModeHistory').classList.remove('active');
            document.getElementById('playbackTime').textContent = '';
            _pbShowLiveCode();
        }

        function _pbSetHistoryMode() {
            _pbHistoryMode = true;
            document.getElementById('playbackSliderRow').style.display = 'flex';
            document.getElementById('btnModeHistory').classList.add('active');
            document.getElementById('btnModeLive').classList.remove('active');
            _pbFetchHistory(false);
        }

        /* Auto-play for history mode (post-exam review) */
        function togglePlayback() {
            if (_pbHistoryFrames.length === 0) return;
            const icon = document.getElementById('playIcon');
            if (playbackInterval) {
                clearInterval(playbackInterval);
                playbackInterval = null;
                icon.className = 'bi bi-play-fill';
            } else {
                icon.className = 'bi bi-pause-fill';
                playbackInterval = setInterval(() => {
                    let slider = document.getElementById('playbackSlider');
                    let idx = parseInt(slider.value);
                    if (idx < _pbHistoryFrames.length - 1) {
                        slider.value = idx + 1;
                        onSliderInput();
                    } else {
                        clearInterval(playbackInterval);
                        playbackInterval = null;
                        icon.className = 'bi bi-play-fill';
                    }
                }, 500);
            }
        }
