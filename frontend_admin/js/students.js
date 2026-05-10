        /* ─────────────────────────────────────
           Fetch Students
        ───────────────────────────────────── */
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
                    return;
                }

                emptyState.style.display = 'none';

                let totalQ = 0;
                entries.forEach(([key, info]) => {
                    const displayIp = info.ip || key;
                    totalQ += Number(info.current_question) || 0;
                    listBody.innerHTML += `
                        <tr>
                            <td><span class="student-id">${info.student_id}</span></td>
                            <td><span class="student-name">${info.full_name}</span></td>
                            <td><span class="ip-code">${displayIp}</span></td>
                            <td><span class="question-badge"><i class="bi bi-file-code"></i> Soru ${info.current_question}</span></td>
                            <td><span class="status-badge"><span class="status-dot"></span>Aktif</span></td>
                            <td class="last-seen">${formatLastSeen(info.last_seen)}</td>
                            <td><button class="btn btn-sm btn-outline-primary" style="padding: 2px 8px; font-size: 0.75rem;" onclick="loadPlayback('${info.student_id}', 'q${info.current_question}')"><i class="bi bi-play-circle"></i> İzle</button></td>
                        </tr>
                    `;
                });

                document.getElementById('totalStudents').innerText = entries.length;
                document.getElementById('avgQuestion').innerText = (totalQ / entries.length).toFixed(1);
            } catch (err) {
                console.error('Veri çekme hatası:', err);
            }
        }

        function formatLastSeen(isoString) {
            if (!isoString) return '—';
            const dt = new Date(isoString);
            if (Number.isNaN(dt.getTime())) return isoString;
            return dt.toLocaleTimeString();
        }


