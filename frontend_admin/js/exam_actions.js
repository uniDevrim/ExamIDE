        /* ─────────────────────────────────────
           Exam Actions
        ───────────────────────────────────── */
        async function startExam() {
            examState = 'running';
            examStartTime = Date.now();
            pauseOffset = 0;

            setExamStateBadge('running');
            updateButtons();
            startTimer();
            showToast('Sınav başlatıldı!', 'success');

            // API call (non-blocking)
            try {
                const body = {
                    language: loadedFile?.data?.language || 'python',
                    exam_data: loadedFile?.data || null
                };
                const res = await fetch('/api/admin/start_exam', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const result = await res.json();
                if (!res.ok) showToast(result.error || 'Başlatma hatası.', 'danger');
            } catch (e) { console.warn('start_exam API hatasyı:', e); }
        }

        async function pauseExam() {
            examState = 'paused';
            pauseStart = Date.now();

            setExamStateBadge('paused');
            updateButtons();

            const statusEl = document.getElementById('examStatusTimer');
            statusEl.textContent = 'Duraklatıldı';
            statusEl.style.color = 'var(--accent-warning)';
            document.getElementById('elapsedTimer').className = 'timer-value paused';

            showToast('Sınav duraklatıldı.', 'warning');
            try { await fetch('/api/admin/pause_exam', { method: 'POST' }); } catch { }
        }

        async function resumeExam() {
            if (pauseStart) pauseOffset += Date.now() - pauseStart;
            pauseStart = null;
            examState = 'running';

            setExamStateBadge('running');
            updateButtons();

            const statusEl = document.getElementById('examStatusTimer');
            statusEl.textContent = 'Aktif';
            statusEl.style.color = 'var(--accent-success)';
            document.getElementById('elapsedTimer').className = 'timer-value running';

            showToast('Sınav devam ettiriliyor.', 'info');
            try { await fetch('/api/admin/resume_exam', { method: 'POST' }); } catch { }
        }

        function confirmEndExam() {
            document.getElementById('confirmModal').classList.add('visible');
        }

        function closeConfirmModal() {
            document.getElementById('confirmModal').classList.remove('visible');
        }

        async function endExam() {
            closeConfirmModal();
            examState = 'ended';
            stopTimer();

            setExamStateBadge('ended');
            updateButtons();

            const statusEl = document.getElementById('examStatusTimer');
            statusEl.textContent = 'Sona Erdi';
            statusEl.style.color = 'var(--accent-danger)';
            document.getElementById('elapsedTimer').className = 'timer-value';
            document.getElementById('elapsedTimer').style.color = 'var(--accent-danger)';

            showToast('Sınav sona erdirildi.', 'danger', 4000);
            try { await fetch('/api/admin/end_exam', { method: 'POST' }); } catch { }
        }

        // Close modal on overlay click
        document.getElementById('confirmModal').addEventListener('click', function (e) {
            if (e.target === this) closeConfirmModal();
        });


        /* ─────────────────────────────────────
           Sayfa Yenileme: Exam State Geri Yükle
        ───────────────────────────────────── */
        async function restoreExamState() {
            try {
                const res = await fetch('/api/admin/exam/status');
                if (!res.ok) return;
                const status = await res.json();

                const state    = status.state;
                const exam     = status.exam || {};
                const questions = status.questions || {};
                const qCount   = Object.keys(questions).length;

                if (state === 'idle') return; // Geri yüklenecek bir şey yok

                // ── examState'i geri al ──
                examState = state;
                jsonLoaded = true;

                // ── Dosya yükleme göstergesini restore et ──
                if (exam.name) {
                    questionCount = qCount;
                    loadedFile = { name: `${exam.name} (sunucudan)`, data: null, questions };

                    document.getElementById('fileLoaded').classList.add('visible');
                    document.getElementById('fileLoadedName').textContent = exam.name;
                    document.getElementById('fileLoadedMeta').textContent =
                        `${qCount} soru • ${exam.language || ''} • Sunucudan yüklendi`;

                    document.getElementById('questionsInfo').style.display = 'flex';
                    document.getElementById('qCount').textContent = qCount;
                }

                // ── Badge & butonlar ──
                setExamStateBadge(state);
                updateButtons();

                // ── Elapsed timer'ı restore et ──
                const timerEl  = document.getElementById('elapsedTimer');
                const statusEl = document.getElementById('examStatusTimer');

                if (state === 'running') {
                    // started_at + elapsed hesapla
                    if (status.started_at) {
                        const startedAt  = new Date(status.started_at);
                        examStartTime    = startedAt.getTime();
                        pauseOffset      = 0; // pause bilgisi elimizde yok, 0 al

                        timerEl.className    = 'timer-value running';
                        statusEl.textContent = 'Aktif';
                        statusEl.style.color = 'var(--accent-success)';
                        startTimer();
                    }
                } else if (state === 'paused') {
                    timerEl.className    = 'timer-value paused';
                    statusEl.textContent = 'Duraklatıldı';
                    statusEl.style.color = 'var(--accent-warning)';
                } else if (state === 'ended') {
                    timerEl.className        = 'timer-value';
                    timerEl.style.color      = 'var(--accent-danger)';
                    statusEl.textContent     = 'Sona Erdi';
                    statusEl.style.color     = 'var(--accent-danger)';
                }

                showToast(`Sınav durumu geri yüklendi: ${state === 'running' ? 'Devam ediyor' : state === 'paused' ? 'Duraklatılmış' : 'Sona Erdi'}`, 'info');

            } catch (e) {
                console.warn('restoreExamState hatası:', e);
            }
        }

