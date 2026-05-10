        /* ─────────────────────────────────────
           State
        ───────────────────────────────────── */
        let examState = 'idle';   // idle | running | paused | ended
        let jsonLoaded = false;
        let loadedFile = null;
        let questionCount = 0;
        let examStartTime = null;
        let timerInterval = null;


        /* ─────────────────────────────────────
           Button State Manager
        ───────────────────────────────────── */
        function updateButtons() {
            const start = document.getElementById('btnStart');
            const pause = document.getElementById('btnPause');
            const resume = document.getElementById('btnResume');
            const end = document.getElementById('btnEnd');

            // Reset all
            [start, pause, resume, end].forEach(b => b.disabled = true);

            if (examState === 'idle') {
                start.disabled = !jsonLoaded;
            } else if (examState === 'running') {
                pause.disabled = false;
                end.disabled = false;
            } else if (examState === 'paused') {
                resume.disabled = false;
                end.disabled = false;
            }
            // ended → all stay disabled
        }


        /* ─────────────────────────────────────
           Exam State Badge
        ───────────────────────────────────── */
        function setExamStateBadge(state) {
            const badge = document.getElementById('examStateBadge');
            const text = document.getElementById('examStateText');
            badge.className = `exam-state-badge ${state}`;
            const labels = { idle: 'Bekleniyor', running: 'Devam Ediyor', paused: 'Duraklatıldı', ended: 'Sona Erdi' };
            text.textContent = labels[state] || state;
        }


        /* ─────────────────────────────────────
           Timer
        ───────────────────────────────────── */
        function formatTime(ms) {
            const s = Math.floor(ms / 1000);
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const sec = s % 60;
            return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
        }

        let pauseOffset = 0;
        let pauseStart = null;

        function startTimer() {
            const timerEl = document.getElementById('elapsedTimer');
            const statusEl = document.getElementById('examStatusTimer');
            timerEl.className = 'timer-value running';
            statusEl.textContent = 'Aktif';
            statusEl.style.color = 'var(--accent-success)';

            timerInterval = setInterval(() => {
                if (examState === 'running') {
                    timerEl.textContent = formatTime(Date.now() - examStartTime - pauseOffset);
                }
            }, 1000);
        }

        function stopTimer() {
            clearInterval(timerInterval);
        }


