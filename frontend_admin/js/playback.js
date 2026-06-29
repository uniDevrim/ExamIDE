        /* ─────────────────────────────────────
           Playback Logic (v2)
           - Question tabs
           - Auto-refresh every 5s
           - Live follow mode
        ───────────────────────────────────── */
        let _pbAllData        = {};       // { "q1": [{timestamp, code}, ...], "q2": [...] }
        let _pbActiveQuestion = null;
        let _pbFrames         = [];       // frames for current question
        let _pbStudentNo      = null;
        let _pbStudentName    = '';
        let _pbExamId         = null;

        let playbackInterval  = null;     // auto-play interval
        let _pbRefreshInterval = null;    // auto-refresh interval (5s)
        let _pbLiveFollow     = false;    // live follow mode

        /**
         * Called by the "İzle" button in the student list.
         * Loads ALL questions' playback for this student.
         */
        async function loadPlayback(studentNo, studentName) {
            _pbStudentNo   = studentNo;
            _pbStudentName = studentName || studentNo;
            _pbExamId      = _tmSessionData?.exam_id || 'exam_001';
            _pbAllData     = {};
            _pbActiveQuestion = null;
            _pbFrames      = [];

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
            document.getElementById('playbackTime').textContent = '';
            document.getElementById('playbackFrameInfo').textContent = '';
            document.getElementById('playbackQuestionTabs').innerHTML =
                '<span style="color:var(--text-muted);font-size:0.8rem;padding:4px;">Yükleniyor...</span>';

            // Fetch all questions' frames
            await _pbFetchAllFrames();

            // Start auto-refresh
            _pbStopRefresh();
            _pbRefreshInterval = setInterval(_pbFetchAllFrames, 5000);

            // Default to live follow ON
            _pbLiveFollow = true;
            _pbUpdateLiveFollowBtn();
        }

        function _pbStopRefresh() {
            if (_pbRefreshInterval) {
                clearInterval(_pbRefreshInterval);
                _pbRefreshInterval = null;
            }
        }

        // Also stop when accordion is closed or hidden
        // (called implicitly when panel display is set to none)

        async function _pbFetchAllFrames() {
            if (!_pbStudentNo || !_pbExamId) return;
            try {
                const res = await fetch(`/api/admin/playback/${encodeURIComponent(_pbExamId)}/${encodeURIComponent(_pbStudentNo)}`);
                if (!res.ok) {
                    // No history yet — keep tabs empty
                    _pbAllData = {};
                    _pbRenderTabs();
                    document.getElementById('playbackStatus').textContent = 'Kayıt yok';
                    return;
                }
                const data = await res.json();
                _pbAllData = data.questions || {};
                _pbRenderTabs();

                // If live follow is on, jump to latest frame
                if (_pbLiveFollow && _pbFrames.length > 0) {
                    const slider = document.getElementById('playbackSlider');
                    slider.value = _pbFrames.length - 1;
                    onSliderInput();
                }

                // Update status
                const totalFrames = Object.values(_pbAllData).reduce((s, f) => s + f.length, 0);
                document.getElementById('playbackStatus').textContent =
                    `${_pbStudentName} · ${totalFrames} kayıt`;
            } catch (err) {
                console.warn('[Playback] fetch error:', err);
            }
        }

        function _pbRenderTabs() {
            const tabsEl = document.getElementById('playbackQuestionTabs');
            const keys = Object.keys(_pbAllData).sort();

            if (keys.length === 0) {
                tabsEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem;padding:4px;">Henüz kayıt yok.</span>';
                _pbFrames = [];
                document.getElementById('playbackCode').value = '';
                document.getElementById('playbackFrameInfo').textContent = '0 kare';
                return;
            }

            // Pick initial tab
            if (!_pbActiveQuestion || !_pbAllData[_pbActiveQuestion]) {
                _pbActiveQuestion = keys[0];
            }

            tabsEl.innerHTML = keys.map(k => {
                const active = k === _pbActiveQuestion ? 'active' : '';
                const label  = k.startsWith('q') ? `Soru ${k.slice(1)}` : k;
                const count  = _pbAllData[k].length;
                return `<button class="live-tab-btn ${active}" onclick="_pbSwitchTab('${k}')">${label} <span style="opacity:0.6;font-size:0.68rem;">(${count})</span></button>`;
            }).join('');

            // Load frames for active question
            _pbFrames = _pbAllData[_pbActiveQuestion] || [];
            const slider = document.getElementById('playbackSlider');
            const prevMax = parseInt(slider.max);
            slider.max = Math.max(0, _pbFrames.length - 1);

            // If new frames arrived and we're in live follow, jump to end
            if (_pbLiveFollow && _pbFrames.length > 0 && _pbFrames.length - 1 > prevMax) {
                slider.value = _pbFrames.length - 1;
            }

            document.getElementById('playbackFrameInfo').textContent = `${_pbFrames.length} kare`;
            if (_pbFrames.length > 0) {
                onSliderInput();
            }
        }

        function _pbSwitchTab(questionId) {
            _pbActiveQuestion = questionId;
            _pbRenderTabs();
            // Reset slider to beginning for the new question
            if (!_pbLiveFollow) {
                document.getElementById('playbackSlider').value = 0;
                onSliderInput();
            }
        }

        function onSliderInput() {
            if (_pbFrames.length === 0) return;
            const idx = document.getElementById('playbackSlider').value;
            const frame = _pbFrames[idx];
            if (!frame) return;
            document.getElementById('playbackCode').value = frame.code;
            document.getElementById('playbackTime').innerText =
                `${parseInt(idx) + 1}/${_pbFrames.length} · ${new Date(frame.timestamp).toLocaleTimeString('tr-TR')}`;
        }

        /* Auto-play (for post-exam review) */
        function togglePlayback() {
            if (_pbFrames.length === 0) return;
            const icon = document.getElementById('playIcon');
            if (playbackInterval) {
                clearInterval(playbackInterval);
                playbackInterval = null;
                icon.className = 'bi bi-play-fill';
            } else {
                // Disable live follow when manually playing
                _pbLiveFollow = false;
                _pbUpdateLiveFollowBtn();

                icon.className = 'bi bi-pause-fill';
                playbackInterval = setInterval(() => {
                    let slider = document.getElementById('playbackSlider');
                    let idx = parseInt(slider.value);
                    if (idx < _pbFrames.length - 1) {
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

        /* Live Follow toggle */
        function toggleLiveFollow() {
            _pbLiveFollow = !_pbLiveFollow;
            _pbUpdateLiveFollowBtn();
            if (_pbLiveFollow && _pbFrames.length > 0) {
                // Jump to latest
                const slider = document.getElementById('playbackSlider');
                slider.value = _pbFrames.length - 1;
                onSliderInput();
            }
        }

        function _pbUpdateLiveFollowBtn() {
            const btn = document.getElementById('btnLiveFollow');
            if (_pbLiveFollow) {
                btn.style.background = 'rgba(34,197,94,0.2)';
                btn.style.borderColor = 'rgba(34,197,94,0.5)';
                btn.style.color = 'var(--accent-success)';
                btn.innerHTML = '<i class="bi bi-broadcast"></i> Canlı Takip: AÇIK';
            } else {
                btn.style.background = 'rgba(113,113,122,0.1)';
                btn.style.borderColor = 'rgba(113,113,122,0.3)';
                btn.style.color = 'var(--text-muted)';
                btn.innerHTML = '<i class="bi bi-broadcast"></i> Canlı Takip: KAPALI';
            }
        }
