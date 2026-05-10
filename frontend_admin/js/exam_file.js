        /* ─────────────────────────────────────
           Drag & Drop
        ───────────────────────────────────── */
        const dropzone = document.getElementById('dropzone');

        dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', e => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) processFile(file);
        });

        function handleFileSelect(e) {
            const file = e.target.files[0];
            if (file) processFile(file);
        }


        /* ─────────────────────────────────────
           JSON Schema Validator
        ───────────────────────────────────── */
        function validateExamJson(data) {
            const errors = [];

            // Üst düzey zorunlu alanlar
            const topRequired = ['name', 'description', 'time', 'language', 'questions'];
            for (const field of topRequired) {
                if (data[field] === undefined || data[field] === null || data[field] === '') {
                    errors.push(`Üst seviye alan eksik veya boş: "${field}"`);
                }
            }

            // questions bir nesne (object) olmalı
            if (data.questions !== undefined) {
                if (typeof data.questions !== 'object' || Array.isArray(data.questions) || data.questions === null) {
                    errors.push('"questions" alanı bir nesne (object) olmalıdır, dizi (array) değil.');
                } else {
                    const keys = Object.keys(data.questions);
                    if (keys.length === 0) {
                        errors.push('"questions" nesnesi en az 1 soru içermelidir.');
                    }
                    keys.forEach((qKey) => {
                        const q = data.questions[qKey];
                        const qLabel = `Soru "${qKey}"`;

                        if (!q || typeof q !== 'object') {
                            errors.push(`${qLabel}: geçersiz yapı.`);
                            return;
                        }

                        const qRequired = ['title', 'description', 'test-cases', 'run-time-limit', 'memory-limit', 'points'];
                        for (const f of qRequired) {
                            if (q[f] === undefined || q[f] === null) {
                                errors.push(`${qLabel}: "${f}" alanı eksik.`);
                            }
                        }

                        // test-cases kontrolü
                        if (q['test-cases'] !== undefined) {
                            if (!Array.isArray(q['test-cases'])) {
                                errors.push(`${qLabel}: "test-cases" bir dizi (array) olmalıdır.`);
                            } else if (q['test-cases'].length === 0) {
                                errors.push(`${qLabel}: "test-cases" en az 1 test durumu içermelidir.`);
                            } else {
                                q['test-cases'].forEach((tc, idx) => {
                                    if (tc.input === undefined) errors.push(`${qLabel} test-case[${idx}]: "input" alanı eksik.`);
                                    if (tc.output === undefined) errors.push(`${qLabel} test-case[${idx}]: "output" alanı eksik.`);
                                });
                            }
                        }

                        // Sayısal alan kontrolleri
                        if (q['run-time-limit'] !== undefined && typeof q['run-time-limit'] !== 'number') {
                            errors.push(`${qLabel}: "run-time-limit" sayısal bir değer olmalıdır.`);
                        }
                        if (q['memory-limit'] !== undefined && typeof q['memory-limit'] !== 'number') {
                            errors.push(`${qLabel}: "memory-limit" sayısal bir değer olmalıdır.`);
                        }
                        if (q['points'] !== undefined && typeof q['points'] !== 'number') {
                            errors.push(`${qLabel}: "points" sayısal bir değer olmalıdır.`);
                        }
                    });
                }
            }

            return errors;
        }

        function showJsonErrorModal(filename, errors) {
            document.getElementById('jsonErrorSubtitle').textContent =
                `"${filename}" dosyası beklenen şemaya uymuyor. Lütfen aşağıdaki hataları giderin.`;
            const list = document.getElementById('jsonErrorList');
            list.innerHTML = errors.map(err =>
                `<li><i class="bi bi-dot"></i>${err}</li>`
            ).join('');
            document.getElementById('jsonErrorOverlay').classList.add('visible');
        }

        function closeJsonErrorModal(event) {
            if (!event || event.target === document.getElementById('jsonErrorOverlay')) {
                document.getElementById('jsonErrorOverlay').classList.remove('visible');
            }
        }

        function processFile(file) {
            if (!file.name.endsWith('.json')) {
                showToast('Yalnızca .json dosyaları kabul edilir.', 'danger');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // Yapı doğrulaması
                    const errors = validateExamJson(data);
                    if (errors.length > 0) {
                        showJsonErrorModal(file.name, errors);
                        return;
                    }

                    const questions = data.questions;
                    questionCount = Object.keys(questions).length;

                    loadedFile = { name: file.name, data, questions };
                    jsonLoaded = true;

                    // Show file indicator
                    document.getElementById('fileLoaded').classList.add('visible');
                    document.getElementById('fileLoadedName').textContent = file.name;
                    document.getElementById('fileLoadedMeta').textContent = `${questionCount} soru yüklendi`;

                    // Show count in timer row
                    document.getElementById('questionsInfo').style.display = 'flex';
                    document.getElementById('qCount').textContent = questionCount;

                    updateButtons();
                    showToast(`${questionCount} soru başarıyla yüklendi.`, 'success');
                } catch {
                    showToast('Geçersiz JSON dosyası — parse hatası.', 'danger');
                }
            };
            reader.readAsText(file);
        }

        function removeFile() {
            if (examState === 'running' || examState === 'paused') {
                showToast('Sınav devam ederken dosya kaldırılamaz.', 'warning');
                return;
            }
            jsonLoaded = false;
            loadedFile = null;
            questionCount = 0;
            document.getElementById('fileLoaded').classList.remove('visible');
            document.getElementById('jsonFileInput').value = '';
            document.getElementById('questionsInfo').style.display = 'none';
            updateButtons();
            showToast('Dosya kaldırıldı.', 'info');
        }


