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
                    <div class="col-md-6">
                        <div class="form-floating">
                            <input type="text" class="form-control q-funcname" id="qFuncName_${qId}" placeholder="Fonksiyon Adı" value="solution" required style="background: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);">
                            <label for="qFuncName_${qId}" style="color: var(--text-muted);">Fonksiyon Adı (Örn: is_prime, twoSum)</label>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-floating">
                            <input type="text" class="form-control q-returntype" id="qReturnType_${qId}" placeholder="Dönüş Tipi" value="bool" required style="background: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);">
                            <label for="qReturnType_${qId}" style="color: var(--text-muted);">Dönüş Tipi (Örn: bool, int, string)</label>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <div style="background: rgba(255,255,255,0.02); border: 1px dashed var(--border-color); border-radius: 8px; padding: 12px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                                <label style="color: var(--text-primary); font-size: 0.85rem; font-weight:600; margin: 0;">
                                    <i class="bi bi-sliders"></i> Fonksiyon Parametreleri
                                </label>
                                <button type="button" class="btn btn-sm btn-outline-primary" onclick="addParameter(${qId})" style="font-size:0.75rem; padding: 3px 10px;">
                                    <i class="bi bi-plus-circle"></i> Parametre Ekle
                                </button>
                            </div>
                            <div id="parametersContainer_${qId}">
                                <!-- Parametre satırları buraya eklenir -->
                            </div>
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
    
    // Varsayılan 1 parametre ve 1 test case ekle
    addParameter(qId, "n", "int");
    addTestCase(qId);
}

function removeQuestionCard(qId) {
    const card = document.getElementById(`questionCard_${qId}`);
    if (card) card.remove();
}

function addParameter(qId, name = '', type = 'int') {
    const container = document.getElementById(`parametersContainer_${qId}`);
    if (!container) return;
    const pId = Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const row = document.createElement("div");
    row.className = "row g-2 mb-2 param-row align-items-center";
    row.innerHTML = `
        <div class="col-md-6">
            <div class="form-floating">
                <input type="text" class="form-control p-name" id="pName_${pId}" placeholder="Parametre Adı" value="${name}" required style="background: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);">
                <label for="pName_${pId}" style="color: var(--text-muted);">Parametre Adı (Örn: n, nums)</label>
            </div>
        </div>
        <div class="col-md-5">
            <div class="form-floating">
                <input type="text" class="form-control p-type" id="pType_${pId}" placeholder="Tip" value="${type}" required style="background: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);">
                <label for="pType_${pId}" style="color: var(--text-muted);">Tip (Örn: int, string, vector&lt;int&gt;)</label>
            </div>
        </div>
        <div class="col-md-1 d-flex justify-content-end">
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.closest('.param-row').remove()" title="Parametre Sil" style="height: 45px; width: 45px; border-radius: 8px;">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    container.appendChild(row);
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
                <textarea class="form-control tc-input" id="tcIn_${uid}" placeholder="Parametreler (JSON)" style="height: 55px; font-family: monospace; font-size: 0.85rem; background: var(--bg-editor); border-color: var(--border-color); color: var(--text-primary); resize: none;"></textarea>
                <label for="tcIn_${uid}" style="color: var(--text-muted); font-size: 0.8rem; padding-top: 12px;">Parametreler JSON [arg1, arg2] (Örn: [7])</label>
            </div>
        </div>
        <div class="col-md-5">
            <div class="form-floating">
                <textarea class="form-control tc-output" id="tcOut_${uid}" placeholder="Beklenen Değer (JSON)" style="height: 55px; font-family: monospace; font-size: 0.85rem; background: var(--bg-editor); border-color: var(--border-color); color: var(--text-primary); resize: none;"></textarea>
                <label for="tcOut_${uid}" style="color: var(--text-muted); font-size: 0.8rem; padding-top: 12px;">Beklenen Dönüş Değeri JSON (Örn: true)</label>
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
        exam_id: "exam_" + Date.now(),
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
        const funcName = (card.querySelector(".q-funcname")?.value || "").trim();
        const returnType = (card.querySelector(".q-returntype")?.value || "void").trim();
        const runTime = parseInt(card.querySelector(".q-time").value) || 5;
        const memLimit = parseInt(card.querySelector(".q-memory").value) || 1024;
        const points = parseInt(card.querySelector(".q-points").value) || 10;
        
        if (!title) {
            hasError = true;
            showToast(`Soru ${qIndex} başlığı eksik.`, "warning");
        }
        if (!funcName) {
            hasError = true;
            showToast(`Soru ${qIndex} fonksiyon adı eksik.`, "warning");
        }

        // Parametreleri topla
        const paramRows = card.querySelectorAll(".param-row");
        const parameters = [];
        paramRows.forEach(pRow => {
            const pName = pRow.querySelector(".p-name")?.value.trim();
            const pType = pRow.querySelector(".p-type")?.value.trim() || "int";
            if (pName) {
                parameters.push({ name: pName, type: pType });
            }
        });
        
        const testCaseRows = card.querySelectorAll(".test-case-row");
        const testCases = [];
        
        testCaseRows.forEach(row => {
            const inputRaw = row.querySelector(".tc-input").value.trim();
            const outputRaw = row.querySelector(".tc-output").value.trim();
            
            let parsedInput = inputRaw;
            try {
                parsedInput = JSON.parse(inputRaw);
            } catch (e) {
                // Eğer doğrudan dizi değilse [inputRaw] olarak sarmala
                if (!inputRaw.startsWith('[') && !isNaN(Number(inputRaw))) {
                    parsedInput = [Number(inputRaw)];
                } else if (!inputRaw.startsWith('[')) {
                    parsedInput = [inputRaw];
                }
            }

            let parsedExpected = outputRaw;
            try {
                parsedExpected = JSON.parse(outputRaw);
            } catch (e) {
                if (outputRaw.toLowerCase() === 'true') parsedExpected = true;
                else if (outputRaw.toLowerCase() === 'false') parsedExpected = false;
                else if (!isNaN(Number(outputRaw))) parsedExpected = Number(outputRaw);
            }

            testCases.push({
                input: parsedInput,
                expected: parsedExpected
            });
        });
        
        if (testCases.length === 0) {
            hasError = true;
            showToast(`Soru ${qIndex} için en az bir test case ekleyin.`, "warning");
        }
        
        result.questions[qIndex.toString()] = {
            title: title,
            description: desc,
            function_name: funcName,
            parameters: parameters,
            return_type: returnType,
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
