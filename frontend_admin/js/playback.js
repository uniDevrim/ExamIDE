        /* ─────────────────────────────────────
           Playback Logic
        ───────────────────────────────────── */
        let playbackFrames = [];
        let playbackInterval = null;

        async function loadPlayback(studentNo, questionId) {
            document.getElementById('playbackAccordion').style.display = 'block';
            document.getElementById('playbackAccordion').classList.add('open');
            document.getElementById('playbackAccordion').scrollIntoView({ behavior: 'smooth' });
            document.getElementById('playbackStatus').innerText = `Yükleniyor...`;
            try {
                const eId = _tmSessionData?.exam_id || 'exam_001';
                const res = await fetch(`/api/admin/playback/${eId}/${studentNo}/${questionId}`);
                if (!res.ok) throw new Error("No history");
                const data = await res.json();
                playbackFrames = data.frames || [];
                if (playbackFrames.length === 0) throw new Error("Empty frames");
                
                document.getElementById('playbackSlider').max = playbackFrames.length - 1;
                document.getElementById('playbackSlider').value = 0;
                document.getElementById('playbackStatus').innerText = `${studentNo} - Soru ${questionId} (${playbackFrames.length} kare)`;
                
                onSliderInput();
            } catch (err) {
                showToast("Geçmiş bulunamadı.", "warning");
                playbackFrames = [];
                document.getElementById('playbackCode').value = '';
                document.getElementById('playbackTime').innerText = '';
                document.getElementById('playbackStatus').innerText = `Kayıt Yok`;
            }
        }

        function onSliderInput() {
            if (playbackFrames.length === 0) return;
            const idx = document.getElementById('playbackSlider').value;
            const frame = playbackFrames[idx];
            document.getElementById('playbackCode').value = frame.code;
            document.getElementById('playbackTime').innerText = new Date(frame.timestamp).toLocaleTimeString('tr-TR');
        }

        function togglePlayback() {
            if (playbackFrames.length === 0) return;
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
                    if (idx < playbackFrames.length - 1) {
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


