        // ═══════════════════════════════════════════════
        // TimeMachine Admin UI
        // ═══════════════════════════════════════════════

        let _tmSessionData = null;

        /** Sayfa yüklenince TimeMachine durumunu kontrol eder. */
        async function tmCheckStartup() {
            // Eğer zaten bir sınav yüklüyse (manuel yükleme veya az önce restore yapılmışsa) banner gösterme
            if (examState !== 'idle') return;

            try {
                const res = await fetch('/api/admin/timemachine/status');
                if (!res.ok) return;
                const data = await res.json();
                _tmSessionData = data;
                tmUpdateTabStats(data);

                if (data.has_session) {
                    const banner   = document.getElementById('tmStartupBanner');
                    const infoEl   = document.getElementById('tmBannerInfo');
                    const sc       = data.student_count || 0;
                    const snap     = data.snapshot_count || 0;
                    const state    = data.session_state || 'idle';
                    const startAt  = data.started_at ? new Date(data.started_at).toLocaleString('tr-TR') : '—';
                    infoEl.textContent = `Durum: ${state} | ${sc} öğrenci | ${snap} kod snapshot | Başlangıç: ${startAt}`;
                    banner.style.display = 'flex';
                }
            } catch(e) {
                console.warn('[TimeMachine] startup check hatası:', e);
            }
        }

        /** "Yeniden Yükle" butonuna basıldı */
        async function tmLoadRestore() {
            document.getElementById('tmStartupBanner').style.display = 'none';
            try {
                const res = await fetch('/api/admin/timemachine/restore', { method: 'POST' });
                const data = await res.json();
                if (data.status === 'restored') {
                    showToast('✅ TimeMachine: Oturum başarıyla yüklendi!', 'success');
                    tmRefreshStats();
                    // Sayfayı yenilemek en garantisi çünkü tüm state değişiyor
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showToast('⚠️ Restore sırasında hata: ' + (data.error || '?'), 'warning');
                }
            } catch(e) {
                showToast('❌ Bağlantı hatası', 'danger');
            }
        }

        /** "Yoksay" butonuna basıldı → onay modalını aç */
        function tmAskSkip() {
            document.getElementById('tmSkipOverlay').classList.add('visible');
        }

        /** Yoksay onay modalını kapat */
        function tmCloseSkipModal() {
            document.getElementById('tmSkipOverlay').classList.remove('visible');
        }

        /** Kullanıcı "Evet, Yoksay" dedi */
        function tmConfirmSkip() {
            tmCloseSkipModal();
            document.getElementById('tmStartupBanner').style.display = 'none';
            showToast('ℹ️ TimeMachine oturumu yoksayıldı.', 'info');
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
            const stateMap = {idle:'Beklemede', running:'Çalışıyor', paused:'Duraklatıldı', ended:'Bitti'};
            document.getElementById('tmStateVal').textContent    = stateMap[data.session_state] || data.session_state || '—';
            document.getElementById('tmStudentCount').textContent = data.student_count ?? '—';
            document.getElementById('tmSnapshotCount').textContent = data.snapshot_count ?? '—';
            document.getElementById('tmExamId').textContent      = data.exam_id || '—';
            document.getElementById('tmDbPath').textContent      = '📂 ' + (data.db_path || '—');
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
            fetch('/api/admin/timemachine/reset', { method: 'POST' })
                .then(r => r.json())
                .then(data => {
                    if (data.status === 'reset') {
                        showToast('🗑️ TimeMachine DB sıfırlandı', 'success');
                        document.getElementById('tmStartupBanner').style.display = 'none';
                        tmRefreshStats();
                    } else {
                        showToast('❌ Sıfırlama hatası: ' + (data.error||'?'), 'danger');
                    }
                })
                .catch(() => showToast('❌ Bağlantı hatası', 'danger'));
        }

