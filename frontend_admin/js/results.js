        // ==========================================
        // Results & Grading
        // ==========================================
        let allResults = [];

        function loadResults() {
            if (typeof globalExamId === 'undefined' || !globalExamId) return;
            fetch(`/api/admin/exam/${globalExamId}/results`)
                .then(r => r.json())
                .then(data => {
                    allResults = data || [];
                    renderResultsList();
                })
                .catch(err => {
                    showToast('❌ Sonuçlar alınamadı', 'danger');
                });
        }

        function renderResultsList() {
            const list = document.getElementById('resultsList');
            const empty = document.getElementById('resultsEmptyState');
            
            if (allResults.length === 0) {
                list.innerHTML = '';
                empty.style.display = 'block';
                return;
            }

            empty.style.display = 'none';
            list.innerHTML = allResults.map((r, i) => `
                <tr>
                    <td><span class="badge bg-secondary">${r.student_id}</span></td>
                    <td style="color: var(--text-muted); font-size: 0.9rem;">${r.submitted_at}</td>
                    <td>${r.questions ? r.questions.length : 0} Soru</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="viewResultDetail(${i})">
                            <i class="bi bi-eye"></i> Kodu İncele
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        function viewResultDetail(index) {
            const r = allResults[index];
            const body = document.getElementById('resultModalBody');
            
            let html = `
                <div style="margin-bottom: 20px; padding: 15px; background: rgba(59,130,246,0.1); border-radius: 8px;">
                    <h5 style="margin:0; color: var(--accent-primary);">Öğrenci: ${r.student_id}</h5>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 5px;">Teslim: ${r.submitted_at}</div>
                </div>
            `;

            if (r.questions && r.questions.length > 0) {
                r.questions.forEach(q => {
                    const totalTests = q.tests ? q.tests.length : 0;
                    const passedTests = q.tests ? q.tests.filter(t => (typeof t === 'object' && t !== null) ? t.passed === true : !!t).length : 0;
                    
                    let testHtml = '';
                    if (q.tests && q.tests.length > 0) {
                        testHtml = '<div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">';
                        q.tests.forEach((t, idx) => {
                            const isObj = typeof t === 'object' && t !== null;
                            const passed = isObj ? (t.passed === true) : !!t;
                            const color = passed ? 'var(--accent-success)' : 'var(--accent-danger)';
                            const icon = passed ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
                            const badgeBg = passed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
                            
                            let details = '';
                            let stdoutHtml = '';
                            if (isObj) {
                                const expStr = t.expected !== undefined ? JSON.stringify(t.expected) : '';
                                const actStr = t.actual !== undefined ? JSON.stringify(t.actual) : '';
                                const errMsg = t.error_message ? `<div style="color:var(--accent-danger); font-size:0.75rem; margin-top:3px;"><i class="bi bi-exclamation-triangle"></i> ${t.error_message}</div>` : '';
                                
                                details = `
                                    <div style="font-size:0.8rem; margin-top:3px; font-family: monospace;">
                                        <span style="color:var(--text-muted);">Beklenen:</span> <code style="color:var(--text-primary);">${expStr}</code>
                                        ${!passed && actStr ? ` | <span style="color:var(--accent-danger);">Alınan:</span> <code style="color:var(--accent-danger);">${actStr}</code>` : ''}
                                        ${errMsg}
                                    </div>
                                `;

                                if (t.stdout && t.stdout.toString().trim()) {
                                    const safeStdout = t.stdout.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                    stdoutHtml = `
                                        <div style="margin-top:5px; background:rgba(0,0,0,0.3); border-left:2px solid var(--accent-primary, #3b82f6); border-radius:3px; padding:4px 8px; font-size:0.75rem; font-family:monospace; color:#cbd5e1; white-space:pre-wrap; max-height:100px; overflow-y:auto;">
                                            <span style="color:var(--accent-primary, #3b82f6); font-size:0.7rem; font-weight:600;"><i class="bi bi-terminal"></i> Konsol Çıktısı:</span><br>${safeStdout.trim()}
                                        </div>
                                    `;
                                }
                            }

                            testHtml += `
                                <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:6px; padding:6px 10px;">
                                    <div style="display:flex; align-items:center; justify-content:space-between;">
                                        <span style="font-weight:600; font-size:0.85rem; color:${color};">
                                            <i class="bi ${icon}"></i> Test ${idx + 1}
                                        </span>
                                        ${isObj && t.error_type ? `<span style="font-size:0.75rem; padding:2px 8px; border-radius:4px; background:${badgeBg}; color:${color}; font-weight:500;">${t.error_type}</span>` : ''}
                                    </div>
                                    ${details}
                                    ${stdoutHtml}
                                </div>
                            `;
                        });
                        testHtml += '</div>';
                    }

                    html += `
                        <div style="margin-bottom: 30px; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
                            <div style="background: var(--bg-secondary); padding: 15px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                                <h6 style="margin: 0; color: var(--text-primary);">Soru ${q.question_id}</h6>
                                <span style="font-size: 0.85rem; font-weight: 600; color: ${passedTests === totalTests && totalTests > 0 ? 'var(--accent-success)' : 'var(--accent-danger)'};">
                                    ${passedTests}/${totalTests} Test Başarılı
                                </span>
                            </div>
                            <div style="padding: 15px; background: var(--bg-editor); overflow-x: auto;">
                                <pre style="margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: #d4d4d8;"><code>${q.code ? q.code.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '(Kod yazılmamış)'}</code></pre>
                            </div>
                            <div style="padding: 10px 15px; background: var(--bg-primary); border-top: 1px solid var(--border-color);">
                                <div style="font-size: 0.8rem; color: var(--text-secondary);">Test Sonuçları:</div>
                                ${testHtml}
                            </div>
                        </div>
                    `;
                });
            } else {
                html += `<div class="empty-state"><p>Bu sınav için soru bulunamadı.</p></div>`;
            }

            body.innerHTML = html;
            document.getElementById('resultModal').style.display = 'flex';
        }

        function closeResultModal() {
            document.getElementById('resultModal').style.display = 'none';
        }


