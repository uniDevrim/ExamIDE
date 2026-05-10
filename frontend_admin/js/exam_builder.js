let questionIndex = 0;

function addQuestionCard() {
    questionIndex++;
    const qId = questionIndex;
    
    const container = document.getElementById("questionsContainer");
    const cardHtml = `
        <div class="accordion-panel open question-card" id="questionCard_${qId}" style="margin-bottom: 20px; border-left: 4px solid var(--accent-primary); box-shadow: var(--shadow-sm); transition: all 0.3s;">
            <div class="accordion-header" style="justify-content: space-between; border-bottom: 1px solid var(--border-color); cursor: pointer;" onclick="toggleAccordion('questionCard_${qId}')">
                <div class="accordion-title">
                    <i class="bi bi-file-code"></i> Soru ${qId}
                </div>
                <div style="display:flex; align-items:center; gap: 15px;">
                    <i class="bi bi-chevron-down toggle-icon" style="transition: transform 0.3s; color: var(--text-muted);"></i>
                    <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); removeQuestionCard(${qId})" style="border:none;">
                        <i class="bi bi-trash"></i> Sil
                    </button>
                </div>
            </div>
            <div class="accordion-body">
                <div class="row g-3">
                    <div class="col-md-12">
                        <div class="form-floating">
                            <input type="text" class="form-control q-title" id="qTitle_${qId}" placeholder="Soru Başlığı" required style="background: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);">
                            <label for="qTitle_${qId}" style="color: var(--text-muted);">Soru Başlığı (Örn: Fibonacci Serisi)</label>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <div class="form-floating">
                            <textarea class="form-control q-desc" id="qDesc_${qId}" placeholder="Soru Açıklaması" required style="height: 100px; background: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);"></textarea>
                            <label for="qDesc_${qId}" style="color: var(--text-muted);">Sorunun detaylı açıklaması...</label>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-floating">
                            <input type="number" class="form-control q-time" id="qTime_${qId}" placeholder="Zaman" value="5" required style="background: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);">
                            <label for="qTime_${qId}" style="color: var(--text-muted);">Çalışma Süresi Sınırı (Sn)</label>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-floating">
                            <input type="number" class="form-control q-memory" id="qMem_${qId}" placeholder="Bellek" value="1024" required style="background: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);">
                            <label for="qMem_${qId}" style="color: var(--text-muted);">Bellek Sınırı (MB)</label>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-floating">
                            <input type="number" class="form-control q-points" id="qPts_${qId}" placeholder="Puan" value="10" required style="background: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);">
                            <label for="qPts_${qId}" style="color: var(--text-muted);">Puan</label>
                        </div>
                    </div>
                </div>
                
                <hr style="margin: 20px 0; border-color: var(--border-color);">
                
                <h6 style="color: var(--text-primary); margin-bottom: 12px; font-weight:600; font-size: 0.9rem;"><i class="bi bi-list-check"></i> Test Senaryoları (Test Cases)</h6>
                <div id="testCasesContainer_${qId}">
                    <!-- Test cases go here -->
                </div>
                <button class="btn btn-sm btn-outline-primary mt-2" onclick="addTestCase(${qId})" style="border-style: dashed;">
                    <i class="bi bi-plus"></i> Yeni Test Case Ekle
                </button>
            </div>
        </div>
    `;
    
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = cardHtml;
    container.appendChild(tempDiv.firstElementChild);
    
    // Add one default test case
    addTestCase(qId);
}

function removeQuestionCard(qId) {
    const card = document.getElementById(`questionCard_${qId}`);
    if (card) card.remove();
}

function addTestCase(qId) {
    const container = document.getElementById(`testCasesContainer_${qId}`);
    const tcId = container.children.length + 1;
    const uid = `${qId}_${Date.now()}_${tcId}`;
    
    const row = document.createElement("div");
    row.className = "row g-2 mb-2 test-case-row";
    row.style.background = "transparent";
    row.style.padding = "8px 0";
    row.style.borderBottom = "1px solid var(--border-color)";
    row.style.position = "relative";
    row.style.alignItems = "center";
    
    row.innerHTML = `
        <div class="col-md-5">
            <div class="form-floating">
                <textarea class="form-control tc-input" id="tcIn_${uid}" placeholder="Input" style="height: 55px; font-family: monospace; font-size: 0.85rem; background: var(--bg-editor); border-color: var(--border-color); color: var(--text-primary); resize: none;"></textarea>
                <label for="tcIn_${uid}" style="color: var(--text-muted); font-size: 0.8rem; padding-top: 12px;">Girdi (Örn: 5\\n3)</label>
            </div>
        </div>
        <div class="col-md-5">
            <div class="form-floating">
                <textarea class="form-control tc-output" id="tcOut_${uid}" placeholder="Output" style="height: 55px; font-family: monospace; font-size: 0.85rem; background: var(--bg-editor); border-color: var(--border-color); color: var(--text-primary); resize: none;"></textarea>
                <label for="tcOut_${uid}" style="color: var(--text-muted); font-size: 0.8rem; padding-top: 12px;">Beklenen Çıktı (Örn: 8)</label>
            </div>
        </div>
        <div class="col-md-2 d-flex justify-content-end">
            <button class="btn btn-sm btn-outline-danger" onclick="this.parentElement.parentElement.remove()" title="Test Case Sil" style="height: 55px; width: 55px; border-radius: 8px;">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    container.appendChild(row);
}

function generateExamJson() {
    const examName = document.getElementById("examName").value.trim();
    const examTime = document.getElementById("examTime").value;
    const examLanguage = document.getElementById("examLanguage").value;
    const examDescription = document.getElementById("examDescription").value.trim();
    
    if (!examName || !examTime) {
        showToast("Lütfen sınav adı ve süresini doldurun.", "warning");
        return;
    }
    
    const result = {
        name: examName,
        description: examDescription,
        time: examTime,
        language: examLanguage,
        questions: {}
    };
    
    const questionCards = document.querySelectorAll(".question-card");
    if (questionCards.length === 0) {
        showToast("En az bir soru eklemelisiniz.", "warning");
        return;
    }
    
    let hasError = false;
    
    questionCards.forEach((card, index) => {
        const qIndex = index + 1;
        const title = card.querySelector(".q-title").value.trim();
        const desc = card.querySelector(".q-desc").value.trim();
        const runTime = parseInt(card.querySelector(".q-time").value) || 5;
        const memLimit = parseInt(card.querySelector(".q-memory").value) || 1024;
        const points = parseInt(card.querySelector(".q-points").value) || 10;
        
        if (!title) {
            hasError = true;
            showToast(`Soru ${qIndex} başlığı eksik.`, "warning");
        }
        
        const testCaseRows = card.querySelectorAll(".test-case-row");
        const testCases = [];
        
        testCaseRows.forEach(row => {
            const inputVal = row.querySelector(".tc-input").value;
            const outputVal = row.querySelector(".tc-output").value;
            testCases.push({
                input: inputVal,
                output: outputVal
            });
        });
        
        if (testCases.length === 0) {
            hasError = true;
            showToast(`Soru ${qIndex} için en az bir test case ekleyin.`, "warning");
        }
        
        result.questions[qIndex.toString()] = {
            title: title,
            description: desc,
            "test-cases": testCases,
            "run-time-limit": runTime,
            "memory-limit": memLimit,
            "points": points
        };
    });
    
    if (hasError) return;
    
    // Trigger download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", examName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase() + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showToast("JSON başarıyla oluşturuldu ve indirildi!", "success");
}

document.addEventListener("DOMContentLoaded", () => {
    addQuestionCard();
});
