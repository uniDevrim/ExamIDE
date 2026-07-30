        /* ─────────────────────────────────────
           Fetch Students
        ───────────────────────────────────── */
        const ONLINE_THRESHOLD_MS = 15000; // 15 saniye içinde görüldüyse "çevrimiçi"

        async function fetchStudents() {
            try {
                const response = await fetch('/api/admin/students');
                const data = await response.json();

                const listBody = document.getElementById('studentList');
                const emptyState = document.getElementById('emptyState');
                listBody.innerHTML = '';

                const entries = Object.entries(data);

                if (entries.length === 0) {
                    emptyState.style.display = 'block';
                    document.getElementById('totalStudents').innerText = '0';
                    document.getElementById('avgQuestion').innerText = '—';
                    const onlineEl = document.getElementById('onlineStudents');
                    if (onlineEl) onlineEl.innerText = '0';
                    return;
                }

                emptyState.style.display = 'none';

                let totalQ = 0;
                let onlineCount = 0;
                const now = Date.now();

                entries.forEach(([key, info]) => {
                    const displayIp = info.ip || key;
                    totalQ += Number(info.current_question) || 0;

                    // Çevrimiçi / çevrimdışı kontrolü
                    const isOnline = _isStudentOnline(info.last_seen, now);
                    if (isOnline) onlineCount++;

                    const dotColor = isOnline ? '#22c55e' : '#ef4444';
                    const statusText = isOnline ? 'Çevrimiçi' : 'Çevrimdışı';
                    const statusBg = isOnline ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
                    const statusBorder = isOnline ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';

                    listBody.innerHTML += `
                        <tr>
                            <td><span class="student-id">${info.student_id}</span></td>
                            <td><span class="student-name">${info.full_name}</span></td>
                            <td><span class="ip-code">${displayIp}</span></td>
                            <td><span class="question-badge"><i class="bi bi-file-code"></i> Soru ${info.current_question}</span></td>
                            <td>
                                <span style="display:inline-flex; align-items:center; gap:6px; font-size:0.8rem; font-weight:500; padding:3px 10px; border-radius:20px; background:${statusBg}; border:1px solid ${statusBorder}; color:${dotColor};">
                                    <span style="width:7px; height:7px; border-radius:50%; background:${dotColor}; display:inline-block;${isOnline ? ' box-shadow:0 0 6px ' + dotColor + ';' : ''}"></span>
                                    ${statusText}
                                </span>
                            </td>
                            <td class="last-seen">${formatLastSeen(info.last_seen)}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" style="padding: 2px 10px; font-size: 0.75rem;" onclick="loadPlayback('${info.student_id}', '${info.full_name}')"><i class="bi bi-eye"></i> İzle</button>
                            </td>
                        </tr>
                    `;
                });

                document.getElementById('totalStudents').innerText = entries.length;
                document.getElementById('avgQuestion').innerText = (totalQ / entries.length).toFixed(1);

                // Çevrimiçi sayısını güncelle
                const onlineEl = document.getElementById('onlineStudents');
                if (onlineEl) onlineEl.innerText = `${onlineCount} / ${entries.length}`;
            } catch (err) {
                console.error('Veri çekme hatası:', err);
            }
        }

        function _isStudentOnline(isoString, nowMs) {
            if (!isoString) return false;
            const dt = new Date(isoString);
            if (Number.isNaN(dt.getTime())) return false;
            return (nowMs - dt.getTime()) < ONLINE_THRESHOLD_MS;
        }

        function formatLastSeen(isoString) {
            if (!isoString) return '—';
            const dt = new Date(isoString);
            if (Number.isNaN(dt.getTime())) return isoString;
            return dt.toLocaleTimeString();
        }


