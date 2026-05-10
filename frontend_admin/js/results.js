        // ==========================================
        // Results & Grading
        // ==========================================
        let allResults = [];

        function loadResults() {
            if (!currentExamId) return;
            fetch(`/api/admin/exam/${currentExamId}/results`)
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
                    const passedTests = q.tests ? q.tests.filter(t => t).length : 0;
                    
                    let testHtml = '';
                    if (q.tests) {
                        testHtml = '<div style="display:flex; gap:5px; flex-wrap:wrap; margin-top:10px;">';
                        q.tests.forEach((passed, idx) => {
                            const color = passed ? 'var(--accent-success)' : 'var(--accent-danger)';
                            const icon = passed ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
                            testHtml += `<span style="color:${color}; font-size:1.2rem;" title="Test ${idx+1}"><i class="bi ${icon}"></i></span>`;
                        });
                        testHtml += '</div>';
                    }

                    html += `
                        <div style="margin-bottom: 30px; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
                            <div style="background: var(--bg-secondary); padding: 15px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                                <h6 style="margin: 0; color: var(--text-primary);">Soru ${q.question_id}</h6>
                                <span style="font-size: 0.85rem; font-weight: 600; color: ${passedTests === totalTests ? 'var(--accent-success)' : 'var(--accent-danger)'};">
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


