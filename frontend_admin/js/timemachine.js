        // ═══════════════════════════════════════════════
        // TimeMachine Admin UI
        // ═══════════════════════════════════════════════

        let _tmSessionData = null;

        /** Sayfa yüklenince TimeMachine durumunu kontrol eder. */
        async function tmCheckStartup() {
            try {
                const res = await fetch('/api/admin/timemachine/status');
                if (!res.ok) return;
                const data = await res.json();
                _tmSessionData = data;
                tmUpdateTabStats(data);

                // Eğer bu tarayıcı sekmesinde zaten karar verildiyse overlay gösterme
                if (sessionStorage.getItem('tm_resolved') === 'true') return;

                if (data.has_session) {
                    const overlay = document.getElementById('tmStartupOverlay');
                    const infoEl  = document.getElementById('tmStartupInfo');
                    const sc      = data.student_count || 0;
                    const snap    = data.snapshot_count || 0;
                    const state   = data.session_state || 'idle';
                    const stateLabels = { idle: 'Beklemede', running: 'Devam Ediyor', paused: 'Duraklatılmış', ended: 'Sona Ermiş' };
                    const startAt = data.started_at ? new Date(data.started_at).toLocaleString('tr-TR') : '—';
                    infoEl.innerHTML = `
                        <strong>${stateLabels[state] || state}</strong> · ${sc} öğrenci · ${snap} snapshot<br>
                        Başlangıç: ${startAt}
                    `;
                    overlay.classList.add('visible');
                }
            } catch(e) {
                console.warn('[TimeMachine] startup check hatası:', e);
            }
        }

        /** "Devam Et" butonuna basıldı */
        async function tmResumeExam() {
            sessionStorage.setItem('tm_resolved', 'true');
            document.getElementById('tmStartupOverlay').classList.remove('visible');
            try {
                const res = await fetch('/api/admin/timemachine/restore', { method: 'POST' });
                const data = await res.json();
                if (data.status === 'restored') {
                    showToast('✅ Önceki sınav oturumu yüklendi!', 'success');
                    tmRefreshStats();
                    // Sayfayı yenilemek en garantisi çünkü tüm state değişiyor
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showToast('⚠️ Yükleme sırasında hata: ' + (data.error || '?'), 'warning');
                }
            } catch(e) {
                showToast('❌ Bağlantı hatası', 'danger');
            }
        }

        /** "Yeni Sınav" butonuna basıldı → onay modalını aç */
        function tmAskNewExam() {
            document.getElementById('tmNewExamOverlay').classList.add('visible');
        }

        /** Yeni Sınav onay modalını kapat */
        function tmCloseNewExamModal() {
            document.getElementById('tmNewExamOverlay').classList.remove('visible');
        }

        /** Kullanıcı "Evet, Yeni Sınav" dedi → DB + geçmiş temizle */
        async function tmConfirmNewExam() {
            tmCloseNewExamModal();
            sessionStorage.setItem('tm_resolved', 'true');
            document.getElementById('tmStartupOverlay').classList.remove('visible');
            try {
                const res = await fetch('/api/admin/timemachine/full_reset', { method: 'POST' });
                const data = await res.json();
                if (data.status === 'full_reset') {
                    showToast('🗑️ Eski veriler silindi — yeni sınav hazır!', 'success');
                    tmRefreshStats();
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showToast('❌ Sıfırlama hatası: ' + (data.error || '?'), 'danger');
                }
            } catch(e) {
                showToast('❌ Bağlantı hatası', 'danger');
            }
        }


        /** DB istatistiklerini yenile */
        async function tmRefreshStats() {
            try {
                const res = await fetch('/api/admin/timemachine/status');
                if (!res.ok) return;
                const data = await res.json();
                _tmSessionData = data;
                tmUpdateTabStats(data);
                document.getElementById('tmLastUpdate').textContent = 
                    'Güncellendi: ' + new Date().toLocaleTimeString('tr-TR');
                showToast('🔄 TimeMachine durumu güncellendi', 'success');
            } catch(e) {
                showToast('❌ TimeMachine durum alınamadı', 'danger');
            }
        }

        /** Sekmedeki istatistik değerlerini günceller */
        function tmUpdateTabStats(data) {
            const stateMap = {idle:'⏸️ Sınav Yok', running:'✅ Sınav Devam Ediyor', paused:'⏯️ Duraklatıldı', ended:'🏁 Sınav Bitti'};
            document.getElementById('tmStateVal').textContent    = stateMap[data.session_state] || data.session_state || '—';
            document.getElementById('tmStudentCount').textContent = data.student_count ?? '—';
            document.getElementById('tmSnapshotCount').textContent = data.snapshot_count ?? '—';
            document.getElementById('tmExamId').textContent      = data.exam_id || '—';
            document.getElementById('tmLastUpdate').textContent  = 'Son güncelleme: ' + new Date().toLocaleTimeString('tr-TR');

            const badge = document.getElementById('tmTabBadge');
            if (data.has_session) {
                badge.textContent = 'AKTİF';
                badge.style.background = 'rgba(34,197,94,0.15)';
                badge.style.borderColor = 'rgba(34,197,94,0.3)';
                badge.style.color = '#22c55e';
            } else {
                badge.textContent = 'BOŞ';
                badge.style.background = 'rgba(113,113,122,0.15)';
                badge.style.borderColor = 'rgba(113,113,122,0.3)';
                badge.style.color = '#71717a';
            }
        }

        /** DB'yi sıfırla — önce confirm modal */
        function tmConfirmReset() {
            if (!confirm('TimeMachine veritabanını sıfırlamak istediğinizden emin misiniz?\nTüm snapshot ve öğrenci verileri silinir!')) return;
            fetch('/api/admin/timemachine/full_reset', { method: 'POST' })
                .then(r => r.json())
                .then(data => {
                    if (data.status === 'full_reset') {
                        showToast('🗑️ TimeMachine DB ve geçmiş sıfırlandı', 'success');
                        tmRefreshStats();
                    } else {
                        showToast('❌ Sıfırlama hatası: ' + (data.error||'?'), 'danger');
                    }
                })
                .catch(() => showToast('❌ Bağlantı hatası', 'danger'));
        }
