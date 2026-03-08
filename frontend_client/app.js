/* ========================================
   LeetCode-Style Exam Page - JavaScript
   Monaco Editor + Light/Dark Theme
   ======================================== */

// ========================================
// Question Data
// ========================================

const questions = [
    {
        id: 1,
        title: "İki Sayının Toplamı",
        difficulty: "easy",
        points: 15,
        category: "Dizi",
        description: `Bir tam sayı dizisi <code>nums</code> ve bir tam sayı <code>target</code> verildiğinde, toplamları <code>target</code>'a eşit olan iki sayının indekslerini döndürün.

Her girdinin <strong>tam olarak bir çözümü</strong> olduğunu varsayabilirsiniz ve aynı elemanı iki kez kullanamazsınız.

Cevabı herhangi bir sırada döndürebilirsiniz.`,
        examples: [
            {
                input: "nums = [2, 7, 11, 15], target = 9",
                output: "[0, 1]",
                explanation: "nums[0] + nums[1] = 2 + 7 = 9 olduğundan [0, 1] döndürülür."
            },
            {
                input: "nums = [3, 2, 4], target = 6",
                output: "[1, 2]",
                explanation: "nums[1] + nums[2] = 2 + 4 = 6"
            }
        ],
        constraints: [
            "<code>2 ≤ nums.length ≤ 10<sup>4</sup></code>",
            "<code>-10<sup>9</sup> ≤ nums[i] ≤ 10<sup>9</sup></code>",
            "<code>-10<sup>9</sup> ≤ target ≤ 10<sup>9</sup></code>",
            "Yalnızca bir geçerli cevap vardır."
        ],
        starterCode: {
            python: `def iki_sayi_toplami(nums, target):\n    # Kodunuzu buraya yazın\n    pass\n\n# Örnek kullanım\nnums = [2, 7, 11, 15]\ntarget = 9\nprint(iki_sayi_toplami(nums, target))`,
            java: `import java.util.*;\n\npublic class Solution {\n    public int[] ikiSayiToplami(int[] nums, int target) {\n        // Kodunuzu buraya yazın\n        return new int[]{};\n    }\n\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        int[] nums = {2, 7, 11, 15};\n        int target = 9;\n        System.out.println(Arrays.toString(sol.ikiSayiToplami(nums, target)));\n    }\n}`,
            c: `#include <stdio.h>\n#include <stdlib.h>\n\nint* ikiSayiToplami(int* nums, int numsSize, int target, int* returnSize) {\n    // Kodunuzu buraya yazın\n    *returnSize = 2;\n    int* result = (int*)malloc(2 * sizeof(int));\n    return result;\n}\n\nint main() {\n    int nums[] = {2, 7, 11, 15};\n    int target = 9;\n    int returnSize;\n    int* result = ikiSayiToplami(nums, 4, target, &returnSize);\n    printf("[%d, %d]\\n", result[0], result[1]);\n    free(result);\n    return 0;\n}`,
            cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> ikiSayiToplami(vector<int>& nums, int target) {\n        // Kodunuzu buraya yazın\n        return {};\n    }\n};\n\nint main() {\n    Solution sol;\n    vector<int> nums = {2, 7, 11, 15};\n    int target = 9;\n    vector<int> result = sol.ikiSayiToplami(nums, target);\n    cout << "[" << result[0] << ", " << result[1] << "]" << endl;\n    return 0;\n}`
        }
    },
    {
        id: 2,
        title: "Palindrom Sayı",
        difficulty: "easy",
        points: 15,
        category: "Matematik",
        description: `Bir tam sayı <code>x</code> verildiğinde, <code>x</code> bir palindrom ise <code>true</code> döndürün.

Bir tam sayı, soldan sağa ve sağdan sola okunduğunda aynıysa palindromdur.

<strong>Örneğin:</strong> 121 bir palindromdur, 123 değildir. -121 de palindrom değildir çünkü soldan sağa okunduğunda "-121", sağdan sola "121-" olur.`,
        examples: [
            {
                input: "x = 121",
                output: "true",
                explanation: "121 soldan sağa ve sağdan sola okunduğunda aynıdır."
            },
            {
                input: "x = -121",
                output: "false",
                explanation: "Soldan sağa: -121. Sağdan sola: 121-. Bu yüzden palindrom değildir."
            },
            {
                input: "x = 10",
                output: "false",
                explanation: "Sağdan sola okunduğunda 01 olur. Bu yüzden palindrom değildir."
            }
        ],
        constraints: [
            "<code>-2<sup>31</sup> ≤ x ≤ 2<sup>31</sup> - 1</code>",
            "Sayıyı stringe çevirmeden çözmeye çalışın."
        ],
        starterCode: {
            python: `def palindrom_sayi(x):\n    # Kodunuzu buraya yazın\n    pass\n\n# Örnek kullanım\nprint(palindrom_sayi(121))\nprint(palindrom_sayi(-121))\nprint(palindrom_sayi(10))`,
            java: `public class Solution {\n    public boolean palindromSayi(int x) {\n        // Kodunuzu buraya yazın\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        System.out.println(sol.palindromSayi(121));\n        System.out.println(sol.palindromSayi(-121));\n        System.out.println(sol.palindromSayi(10));\n    }\n}`,
            c: `#include <stdio.h>\n#include <stdbool.h>\n\nbool palindromSayi(int x) {\n    // Kodunuzu buraya yazın\n    return false;\n}\n\nint main() {\n    printf("%s\\n", palindromSayi(121) ? "true" : "false");\n    printf("%s\\n", palindromSayi(-121) ? "true" : "false");\n    printf("%s\\n", palindromSayi(10) ? "true" : "false");\n    return 0;\n}`,
            cpp: `#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool palindromSayi(int x) {\n        // Kodunuzu buraya yazın\n        return false;\n    }\n};\n\nint main() {\n    Solution sol;\n    cout << boolalpha;\n    cout << sol.palindromSayi(121) << endl;\n    cout << sol.palindromSayi(-121) << endl;\n    cout << sol.palindromSayi(10) << endl;\n    return 0;\n}`
        }
    },
    {
        id: 3,
        title: "En Uzun Ortak Önek",
        difficulty: "medium",
        points: 20,
        category: "String",
        description: `Bir string dizisi içindeki en uzun ortak öneki bulun.

Ortak önek yoksa boş bir string <code>""</code> döndürün.

Tüm girdiler yalnızca küçük İngilizce harflerden oluşur.`,
        examples: [
            {
                input: 'strs = ["flower", "flow", "flight"]',
                output: '"fl"',
                explanation: '"fl" tüm stringlerin ortak önekidir.'
            },
            {
                input: 'strs = ["dog", "racecar", "car"]',
                output: '""',
                explanation: "Girdiler arasında ortak önek yoktur."
            }
        ],
        constraints: [
            "<code>1 ≤ strs.length ≤ 200</code>",
            "<code>0 ≤ strs[i].length ≤ 200</code>",
            "<code>strs[i]</code> yalnızca küçük İngilizce harflerden oluşur."
        ],
        starterCode: {
            python: `def en_uzun_ortak_onek(strs):\n    # Kodunuzu buraya yazın\n    pass\n\n# Örnek kullanım\nprint(en_uzun_ortak_onek(["flower", "flow", "flight"]))\nprint(en_uzun_ortak_onek(["dog", "racecar", "car"]))`,
            java: `public class Solution {\n    public String enUzunOrtakOnek(String[] strs) {\n        // Kodunuzu buraya yazın\n        return "";\n    }\n\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        System.out.println(sol.enUzunOrtakOnek(new String[]{"flower", "flow", "flight"}));\n        System.out.println(sol.enUzunOrtakOnek(new String[]{"dog", "racecar", "car"}));\n    }\n}`,
            c: `#include <stdio.h>\n#include <string.h>\n\nchar* enUzunOrtakOnek(char** strs, int strsSize) {\n    // Kodunuzu buraya yazın\n    static char result[201];\n    result[0] = '\\0';\n    return result;\n}\n\nint main() {\n    char* strs1[] = {"flower", "flow", "flight"};\n    printf("%s\\n", enUzunOrtakOnek(strs1, 3));\n    return 0;\n}`,
            cpp: `#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    string enUzunOrtakOnek(vector<string>& strs) {\n        // Kodunuzu buraya yazın\n        return "";\n    }\n};\n\nint main() {\n    Solution sol;\n    vector<string> strs1 = {"flower", "flow", "flight"};\n    cout << sol.enUzunOrtakOnek(strs1) << endl;\n    return 0;\n}`
        }
    },
    {
        id: 4,
        title: "Geçerli Parantezler",
        difficulty: "medium",
        points: 25,
        category: "Stack",
        description: `Yalnızca <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code> ve <code>']'</code> karakterlerini içeren bir string <code>s</code> verildiğinde, giriş stringinin geçerli olup olmadığını belirleyin.

Bir giriş stringi şu durumlarda geçerlidir:
<ul style="color: var(--text-primary); margin: 10px 0; padding-left: 20px;">
<li>Açık parantezler aynı türdeki parantezlerle kapatılmalıdır.</li>
<li>Açık parantezler doğru sırada kapatılmalıdır.</li>
<li>Her kapatma parantezinin karşılık gelen bir açma parantezi vardır.</li>
</ul>`,
        examples: [
            {
                input: 's = "()"',
                output: "true",
                explanation: "Tek bir çift parantez, geçerli."
            },
            {
                input: 's = "()[]{}"',
                output: "true",
                explanation: "Her parantez çifti doğru şekilde eşleşmiş."
            },
            {
                input: 's = "(]"',
                output: "false",
                explanation: "Açık parantez farklı türde bir parantezle kapatılmış."
            }
        ],
        constraints: [
            "<code>1 ≤ s.length ≤ 10<sup>4</sup></code>",
            "<code>s</code> yalnızca <code>'()[]{}'</code> karakterlerinden oluşur."
        ],
        starterCode: {
            python: `def gecerli_parantezler(s):\n    # Kodunuzu buraya yazın\n    pass\n\n# Örnek kullanım\nprint(gecerli_parantezler("()"))\nprint(gecerli_parantezler("()[]{}"))\nprint(gecerli_parantezler("(]"))`,
            java: `import java.util.Stack;\n\npublic class Solution {\n    public boolean gecerliParantezler(String s) {\n        // Kodunuzu buraya yazın\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        System.out.println(sol.gecerliParantezler("()"));\n        System.out.println(sol.gecerliParantezler("()[]{}"));\n        System.out.println(sol.gecerliParantezler("(]"));\n    }\n}`,
            c: `#include <stdio.h>\n#include <stdbool.h>\n#include <string.h>\n\nbool gecerliParantezler(char* s) {\n    // Kodunuzu buraya yazın\n    return false;\n}\n\nint main() {\n    printf("%s\\n", gecerliParantezler("()") ? "true" : "false");\n    printf("%s\\n", gecerliParantezler("()[]{}") ? "true" : "false");\n    printf("%s\\n", gecerliParantezler("(]") ? "true" : "false");\n    return 0;\n}`,
            cpp: `#include <iostream>\n#include <stack>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool gecerliParantezler(string s) {\n        // Kodunuzu buraya yazın\n        return false;\n    }\n};\n\nint main() {\n    Solution sol;\n    cout << boolalpha;\n    cout << sol.gecerliParantezler("()") << endl;\n    cout << sol.gecerliParantezler("()[]{}") << endl;\n    cout << sol.gecerliParantezler("(]") << endl;\n    return 0;\n}`
        }
    },
    {
        id: 5,
        title: "Matris Çarpımı",
        difficulty: "hard",
        points: 25,
        category: "Matris",
        description: `İki matris <code>A</code> (m×n) ve <code>B</code> (n×p) verildiğinde, bu iki matrisin çarpımını hesaplayan bir fonksiyon yazın.

Matris çarpımında, sonuç matrisinin her elemanı <code>C[i][j]</code>, A'nın i. satırı ile B'nin j. sütununun iç çarpımıdır:

<code>C[i][j] = Σ(k=0 → n-1) A[i][k] × B[k][j]</code>

Eğer matrisler çarpılamıyorsa (boyut uyumsuzluğu), boş bir matris döndürün.`,
        examples: [
            {
                input: "A = [[1, 2], [3, 4]], B = [[5, 6], [7, 8]]",
                output: "[[19, 22], [43, 50]]",
                explanation: "C[0][0] = 1×5 + 2×7 = 19, C[0][1] = 1×6 + 2×8 = 22, C[1][0] = 3×5 + 4×7 = 43, C[1][1] = 3×6 + 4×8 = 50"
            },
            {
                input: "A = [[1, 0, 2]], B = [[3], [1], [2]]",
                output: "[[7]]",
                explanation: "C[0][0] = 1×3 + 0×1 + 2×2 = 7"
            }
        ],
        constraints: [
            "<code>1 ≤ m, n, p ≤ 100</code>",
            "<code>-100 ≤ A[i][j], B[i][j] ≤ 100</code>",
            "A'nın sütun sayısı B'nin satır sayısına eşit olmalıdır."
        ],
        starterCode: {
            python: `def matris_carpimi(A, B):\n    # Kodunuzu buraya yazın\n    pass\n\n# Örnek kullanım\nA = [[1, 2], [3, 4]]\nB = [[5, 6], [7, 8]]\nsonuc = matris_carpimi(A, B)\nprint(sonuc)`,
            java: `public class Solution {\n    public int[][] matrisCarpimi(int[][] A, int[][] B) {\n        // Kodunuzu buraya yazın\n        return new int[][]{};\n    }\n\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        int[][] A = {{1, 2}, {3, 4}};\n        int[][] B = {{5, 6}, {7, 8}};\n        int[][] sonuc = sol.matrisCarpimi(A, B);\n        for (int[] row : sonuc) {\n            for (int val : row) System.out.print(val + " ");\n            System.out.println();\n        }\n    }\n}`,
            c: `#include <stdio.h>\n#include <stdlib.h>\n\nvoid matrisCarpimi(int** A, int m, int n, int** B, int p, int** C) {\n    // Kodunuzu buraya yazın\n}\n\nint main() {\n    // Matris oluşturma ve test kodu\n    printf("Matris carpimi sonucu:\\n");\n    return 0;\n}`,
            cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> matrisCarpimi(vector<vector<int>>& A, vector<vector<int>>& B) {\n        // Kodunuzu buraya yazın\n        return {};\n    }\n};\n\nint main() {\n    Solution sol;\n    vector<vector<int>> A = {{1, 2}, {3, 4}};\n    vector<vector<int>> B = {{5, 6}, {7, 8}};\n    auto sonuc = sol.matrisCarpimi(A, B);\n    for (auto& row : sonuc) {\n        for (int val : row) cout << val << " ";\n        cout << endl;\n    }\n    return 0;\n}`
        }
    }
];

// ========================================
// State Management
// ========================================
let currentQuestion = 0;
let currentLanguage = 'python';
let userCode = {};  // { questionId_lang: code }
let solvedQuestions = new Set();
let examTimeSeconds = 90 * 60; // 90 minutes
let timerInterval = null;
let monacoEditor = null;
let currentTheme = 'dark';

// Language mapping for Monaco
const monacoLanguageMap = {
    'python': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp'
};

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    setupResizer();
    setupOutputPanel();
    initMonacoEditor();

    // Language selector
    document.getElementById('languageSelect').addEventListener('change', (e) => {
        saveCurrentCode();
        currentLanguage = e.target.value;
        loadCodeForCurrentQuestion();
    });

    // Başlatıcı: önce polling ile soru verisi gelsin
    startStatusPolling();
});

// ========================================
// Monaco Editor
// ========================================
function initMonacoEditor() {
    require.config({
        paths: {
            'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
        }
    });

    // Disable web workers (needed for file:// protocol and cross-origin)
    window.MonacoEnvironment = {
        getWorkerUrl: function () {
            return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                self.MonacoEnvironment = { baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/' };
                importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/base/worker/workerMain.js');
            `)}`;
        }
    };

    require(['vs/editor/editor.main'], function () {
        const q = questions[currentQuestion];
        const startCode = q.starterCode[currentLanguage] || '';

        monacoEditor = monaco.editor.create(document.getElementById('monacoEditorContainer'), {
            value: startCode,
            language: monacoLanguageMap[currentLanguage],
            theme: currentTheme === 'dark' ? 'vs-dark' : 'vs',
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'off',
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            bracketPairColorization: { enabled: true },
            guides: {
                indentation: true,
                bracketPairs: true
            },
            suggest: {
                showKeywords: true,
                showSnippets: true
            }
        });

        // Load the first question
        loadQuestion(0);
    });
}

function getMonacoTheme() {
    return currentTheme === 'dark' ? 'vs-dark' : 'vs';
}

// ========================================
// Theme Toggle
// ========================================
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Update icon
    const icon = document.getElementById('themeIcon');
    if (currentTheme === 'dark') {
        icon.className = 'bi bi-moon-fill';
    } else {
        icon.className = 'bi bi-sun-fill';
    }

    // Update Monaco theme
    if (monacoEditor) {
        monaco.editor.setTheme(getMonacoTheme());
    }

    showToast(currentTheme === 'dark' ? '🌙 Koyu tema aktif' : '☀️ Açık tema aktif', 'info');
}

// ========================================
// Tab System
// ========================================
function initializeTabs() {
    const tabsContainer = document.getElementById('questionTabs');
    tabsContainer.innerHTML = '';

    questions.forEach((q, index) => {
        const tab = document.createElement('button');
        tab.className = 'question-tab' + (index === 0 ? ' active' : '');
        tab.id = `tab-${index}`;
        tab.innerHTML = `${q.id}`;
        tab.title = `Soru ${q.id}: ${q.title}`;
        tab.addEventListener('click', () => switchToQuestion(index));
        tabsContainer.appendChild(tab);
    });

    updateProgressDots();
}

function switchToQuestion(index) {
    if (index === currentQuestion) return;

    saveCurrentCode();

    // Update tabs
    document.querySelectorAll('.question-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${index}`).classList.add('active');

    currentQuestion = index;
    loadQuestion(index);
    updateNavButtons();
    updateProgressDots();
}

// ========================================
// Question Loading
// ========================================
function loadQuestion(index) {
    const q = questions[index];

    // Header
    document.getElementById('questionTitle').innerHTML = `
        <span class="question-number">Soru ${q.id}</span>
        ${q.title}
        <span class="difficulty-badge difficulty-${q.difficulty}">
            ${q.difficulty === 'easy' ? 'Kolay' : q.difficulty === 'medium' ? 'Orta' : 'Zor'}
        </span>
    `;

    document.getElementById('questionMeta').innerHTML = `
        <span><i class="bi bi-tag"></i> ${q.category}</span>
        <span><i class="bi bi-star"></i> ${q.points} Puan</span>
    `;

    // Body
    let bodyHTML = `<p>${q.description}</p>`;

    // Examples
    q.examples.forEach((ex, i) => {
        bodyHTML += `
            <div class="example-block">
                <div class="example-label">Örnek ${i + 1}</div>
                <div class="example-content">
                    <div><span class="input-label">Girdi:</span> ${ex.input}</div>
                    <div><span class="output-label">Çıktı:</span> ${ex.output}</div>
                    ${ex.explanation ? `<div class="explanation">Açıklama: ${ex.explanation}</div>` : ''}
                </div>
            </div>
        `;
    });

    // Constraints
    bodyHTML += `
        <div class="constraints-section">
            <h5><i class="bi bi-exclamation-circle"></i> Kısıtlamalar</h5>
            <ul class="constraints-list">
                ${q.constraints.map(c => `<li>${c}</li>`).join('')}
            </ul>
        </div>
    `;

    document.getElementById('questionBody').innerHTML = bodyHTML;

    // Load code into Monaco
    loadCodeForCurrentQuestion();

    // Update nav buttons
    updateNavButtons();

    // Clear output
    const outputBody = document.getElementById('outputBody');
    outputBody.className = 'output-body';
    outputBody.textContent = 'Henüz çıktı yok. Kodunuzu çalıştırın veya gönderin.';
}

function loadCodeForCurrentQuestion() {
    const q = questions[currentQuestion];
    const key = `${q.id}_${currentLanguage}`;
    const code = userCode[key] || q.starterCode[currentLanguage] || '';

    if (monacoEditor) {
        // Set the language model
        const model = monacoEditor.getModel();
        monaco.editor.setModelLanguage(model, monacoLanguageMap[currentLanguage]);

        // Set value
        monacoEditor.setValue(code);
    }
}

function saveCurrentCode() {
    const q = questions[currentQuestion];
    const key = `${q.id}_${currentLanguage}`;
    if (monacoEditor) {
        userCode[key] = monacoEditor.getValue();
    }
}

// ========================================
// Panel Resizer
// ========================================
function setupResizer() {
    const resizer = document.getElementById('panelResizer');
    const leftPanel = document.querySelector('.question-panel');
    const rightPanel = document.querySelector('.editor-panel');
    const container = document.querySelector('.main-content');

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizer.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const containerRect = container.getBoundingClientRect();
        const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;

        if (percentage > 25 && percentage < 75) {
            leftPanel.style.flex = `0 0 ${percentage}%`;
            rightPanel.style.flex = `0 0 ${100 - percentage}%`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizer.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            // Trigger Monaco layout recalculation
            if (monacoEditor) {
                monacoEditor.layout();
            }
        }
    });
}

// ========================================
// Timer
// ========================================
let _examTimerStarted = false; // ilk başlatıştı mı?

function startTimer() {
    if (timerInterval) clearInterval(timerInterval); // öncekini temizle
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        examTimeSeconds--;
        updateTimerDisplay();

        if (examTimeSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            finishExam(true);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const hours = Math.floor(examTimeSeconds / 3600);
    const minutes = Math.floor((examTimeSeconds % 3600) / 60);
    const seconds = examTimeSeconds % 60;

    const timerEl = document.getElementById('examTimer');
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    document.getElementById('timerDisplay').textContent = timeStr;

    // Danger mode when less than 5 minutes
    if (examTimeSeconds <= 300) {
        timerEl.classList.add('danger');
    } else {
        timerEl.classList.remove('danger');
    }
}

// ========================================
// Output Panel
// ========================================
function setupOutputPanel() {
    const header = document.querySelector('.output-header');
    const panel = document.querySelector('.output-panel');

    header.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
    });
}

// ========================================
// Run & Submit
// ========================================
function runCode(event) {
    if (event) event.preventDefault();
    
    const code = monacoEditor.getValue(); 
    const language = document.getElementById('languageSelect').value.toLowerCase();
    const outputElement = document.getElementById('outputBody');

    console.log("Backend'e gönderilen veri:", { code, language });

    outputElement.innerText = "Kod konteynerde derleniyor...";
    document.querySelector('.output-panel').classList.remove('collapsed');

    fetch('/api/client/run', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code, language: language })
    })
    .then(response => {
        // Eğer backend 500 dönerse burası yakalar
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.stderr || "Sunucu hatası"); });
        }
        return response.json();
    })
    .then(data => {
        outputElement.innerText = data.stdout || data.stderr || "Program çıktı vermedi.";
    })
    .catch(error => {
        console.error('Hata Detayı:', error);
        outputElement.innerText = "Hata: " + error.message;
        outputElement.style.color = "red";
    });
}

function submitCode() {
    saveCurrentCode();
    const outputBody = document.getElementById('outputBody');
    const outputPanel = document.querySelector('.output-panel');

    outputPanel.classList.remove('collapsed');
    outputBody.className = 'output-body';
    outputBody.innerHTML = '<i class="bi bi-hourglass-split"></i> Test senaryoları çalıştırılıyor...';

    // Simulate submission
    setTimeout(() => {
        const passed = Math.random() > 0.3;

        if (passed) {
            const q = questions[currentQuestion];
            solvedQuestions.add(q.id);

            document.getElementById(`tab-${currentQuestion}`).classList.add('solved');
            updateProgressDots();

            outputBody.className = 'output-body success';
            outputBody.innerHTML = `
                <div style="font-size: 1rem; margin-bottom: 10px;">✅ <strong>Kabul Edildi!</strong></div>
                <div style="margin-bottom: 6px;">Geçen test senaryoları: <strong>${q.examples.length}/${q.examples.length}</strong></div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                    Çalışma süresi: ${Math.floor(Math.random() * 50 + 10)}ms | 
                    Bellek: ${(Math.random() * 5 + 10).toFixed(1)} MB |
                    Puan: ${q.points}/${q.points}
                </div>
            `;

            showToast(`Soru ${q.id} başarıyla çözüldü! +${q.points} puan`, 'success');
        } else {
            const failedTest = Math.floor(Math.random() * 3) + 2;
            outputBody.className = 'output-body error';
            outputBody.innerHTML = `
                <div style="font-size: 1rem; margin-bottom: 10px;">❌ <strong>Yanlış Cevap</strong></div>
                <div style="margin-bottom: 6px;">Test senaryosu ${failedTest} başarısız oldu.</div>
                <div style="padding: 8px; background: rgba(0,0,0,0.15); border-radius: 6px; margin-top: 8px;">
                    <div>Girdi: [3, 5, -2, 8, 1]</div>
                    <div>Beklenen: [1, 2]</div>
                    <div>Üretilen: [0, 3]</div>
                </div>
            `;

            showToast('Test senaryosu başarısız oldu', 'error');
        }
    }, 2000);
}

// ========================================
// Navigation
// ========================================
function prevQuestion() {
    if (currentQuestion > 0) {
        switchToQuestion(currentQuestion - 1);
    }
}

function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        switchToQuestion(currentQuestion + 1);
    }
}

function updateNavButtons() {
    const prevBtn = document.getElementById('btnPrev');
    const nextBtn = document.getElementById('btnNext');

    prevBtn.disabled = currentQuestion === 0;
    nextBtn.disabled = currentQuestion === questions.length - 1;
}




function updateProgressDots() {
    const dotsContainer = document.getElementById('progressDots');
    dotsContainer.innerHTML = '';

    questions.forEach((q, i) => {
        const dot = document.createElement('div');
        dot.className = 'progress-dot';
        if (i === currentQuestion) dot.classList.add('active');
        if (solvedQuestions.has(q.id)) dot.classList.add('solved');
        dotsContainer.appendChild(dot);
    });

    document.getElementById('progressText').textContent =
        `${solvedQuestions.size}/${questions.length} çözüldü`;
}

// ========================================
// Exam Finish
// ========================================
function showFinishModal() {
    const summaryEl = document.getElementById('examSummary');
    let totalPoints = 0;
    let earnedPoints = 0;

    let summaryHTML = '';
    questions.forEach(q => {
        totalPoints += q.points;
        const solved = solvedQuestions.has(q.id);
        if (solved) earnedPoints += q.points;

        summaryHTML += `
            <div class="exam-summary-item">
                <span class="label">Soru ${q.id}: ${q.title}</span>
                <span class="value ${solved ? 'success' : ''}">${solved ? `${q.points} puan ✓` : 'Çözülmedi'}</span>
            </div>
        `;
    });

    summaryHTML += `
        <div class="exam-summary-item" style="margin-top: 8px; padding-top: 12px; border-top: 2px solid var(--border-color);">
            <span class="label" style="font-weight: 700; color: var(--text-primary);">Toplam</span>
            <span class="value success" style="font-size: 1rem;">${earnedPoints}/${totalPoints} puan</span>
        </div>
    `;

    summaryEl.innerHTML = summaryHTML;

    const modal = new bootstrap.Modal(document.getElementById('finishModal'));
    modal.show();
}

function confirmFinishExam() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('finishModal'));
    modal.hide();

    saveCurrentCode();

    // Build all questions payload
    const questionsPayload = questions.map(q => ({
        question_id: `q${q.id}`,
        code: userCode[`${q.id}_${currentLanguage}`] || q.starterCode[currentLanguage] || ''
    }));

    showToast('⏳ Sınav gönderiliyor...', 'info');

    fetch('/api/client/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            exam_id: EXAM_ID,
            student_id: STUDENT_ID,
            language: currentLanguage,
            questions: questionsPayload
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.message === 'Submitted successfully') {
            finishExam(false);
        } else if (data.error === 'Already submitted') {
            showToast('⚠️ Bu sınav zaten gönderilmiş.', 'error');
        } else {
            showToast('❌ Hata: ' + (data.error || 'Bilinmeyen hata'), 'error');
        }
    })
    .catch(() => {
        showToast('❌ Sunucuya bağlanılamadı.', 'error');
    });
}

function finishExam(timeUp) {
    clearInterval(timerInterval);
    saveCurrentCode();

    // Disable Monaco
    if (monacoEditor) {
        monacoEditor.updateOptions({ readOnly: true });
    }

    document.querySelectorAll('.question-tab').forEach(t => t.style.pointerEvents = 'none');
    document.querySelector('.btn-finish-exam').disabled = true;

    if (timeUp) {
        showToast('⏰ Süre doldu! Sınav otomatik olarak tamamlandı.', 'info');
    } else {
        showToast('✅ Sınav başarıyla tamamlandı!', 'success');
    }

    setTimeout(() => {
        let totalPoints = 0;
        let earnedPoints = 0;
        questions.forEach(q => {
            totalPoints += q.points;
            if (solvedQuestions.has(q.id)) earnedPoints += q.points;
        });

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); display: flex; align-items: center;
            justify-content: center; z-index: 9999; backdrop-filter: blur(8px);
        `;
        overlay.innerHTML = `
            <div style="text-align: center; color: white;">
                <div style="font-size: 4rem; margin-bottom: 16px;">📝</div>
                <h2 style="font-size: 1.8rem; margin-bottom: 8px;">Sınav Tamamlandı</h2>
                <p style="color: #a1a1aa; margin-bottom: 24px;">Cevaplarınız kaydedildi</p>
                <div style="background: rgba(255,255,255,0.1); border-radius: 16px; padding: 24px 48px; display: inline-block;">
                    <div style="font-size: 3rem; font-weight: 700; color: #22c55e;">${earnedPoints}/${totalPoints}</div>
                    <div style="color: #a1a1aa; margin-top: 4px;">Toplam Puan</div>
                </div>
                <div style="margin-top: 16px; color: #71717a; font-size: 0.85rem;">
                    ${solvedQuestions.size} soru çözüldü / ${questions.length} soru
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }, 500);
}

// ========================================
// Toast Notifications
// ========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;

    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'x-circle';

    toast.innerHTML = `
        <i class="bi bi-${icon}" style="font-size: 1.1rem; color: var(--accent-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'});"></i>
        <span style="font-size: 0.85rem; color: var(--text-primary);">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========================================
// Exam Status Polling
// ========================================

let _lastExamState   = null;   // önceki state (ilk yüklemeyi tetiklemek için)
let _questionsLoaded = false;  // sorular bir kez yüklenince false'a dönmesin
let _pollingInterval = null;

/**
 * Her 3 saniyede bir /api/client/exam/status'a istek atar.
 * State değiştikçe UI'yi günceller.
 */
function startStatusPolling() {
    doPoll();                           // hemen ilk istek
    _pollingInterval = setInterval(doPoll, 3000);
}

async function doPoll() {
    try {
        const res = await fetch('/api/client/exam/status');
        if (!res.ok) return;
        const status = await res.json();
        handleExamStatus(status);
    } catch (e) {
        // ağ hatası — sessizce geç
    }
}

/**
 * API yanıtını işler ve UI durumunu güncelller.
 * @param {Object} status - { state, exam, questions, started_at }
 */
function handleExamStatus(status) {
    const state     = status.state;         // idle | running | paused | ended
    const examData  = status.exam || {};
    const questions_api = status.questions || {};

    const stateChanged = (state !== _lastExamState);
    _lastExamState = state;

    // ─── Overlay kontrolü ───────────────────────────────────────────
    const overlays = {
        waiting : document.getElementById('overlayWaiting'),
        paused  : document.getElementById('overlayPaused'),
        ended   : document.getElementById('overlayEnded'),
    };

    // Tümünü kapat, sonra doğrusunu aç
    Object.values(overlays).forEach(el => el && el.classList.remove('active'));

    if (state === 'idle') {
        overlays.waiting && overlays.waiting.classList.add('active');
        _setEditorReadOnly(true);
    } else if (state === 'paused') {
        overlays.paused && overlays.paused.classList.add('active');
        _setEditorReadOnly(true);
    } else if (state === 'ended') {
        overlays.ended && overlays.ended.classList.add('active');
        _setEditorReadOnly(true);
        clearInterval(_pollingInterval); // artık poll etmeye gerek yok
    } else if (state === 'running') {
        // Tüm overlay'ler kapatıldı, editörü aç
        _setEditorReadOnly(false);
    }

    // ─── Soruları yükle (yalnızca ilk kez, running durumunda) ────────
    if (state === 'running' && !_questionsLoaded) {
        const qKeys = Object.keys(questions_api);
        if (qKeys.length > 0) {
            _loadQuestionsFromApi(questions_api, examData);
            _questionsLoaded = true;
        }
    }

    // ─── Timer: API'dan gelen kalan süreyi kullan ───────────────────
    const remainingSecs = (typeof status.remaining_seconds === 'number' && status.remaining_seconds >= 0)
        ? Math.round(status.remaining_seconds)
        : null;

    if (state === 'idle') {
        // Sınav başlamadı: JSON'daki tam süreyi göster, saydırma
        if (remainingSecs === null && examData.time) {
            examTimeSeconds = _parseTimeSecs(examData.time);
        } else if (remainingSecs !== null) {
            examTimeSeconds = remainingSecs;
        }
        if (!timerInterval) updateTimerDisplay();
    }

    if (state === 'running') {
        // Her poll'da kalan süreyi senkronize et (sayfa yenileme de dahil)
        if (remainingSecs !== null) {
            examTimeSeconds = remainingSecs;
        }
        // Sayaç çalışmıyorsa başlat
        if (!timerInterval) {
            _examTimerStarted = true;
            startTimer();
        }
    }

    // paused olunca saydırmayı durdur, kalan süreyi ekranda dondur
    if (state === 'paused') {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        // Kalan süreyi doğru göster
        if (remainingSecs !== null) {
            examTimeSeconds = remainingSecs;
            updateTimerDisplay();
        }
    }

    if (state === 'ended' && timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/** time alanını saniyeye çevirir. '90' => 5400, '01:30:00' => 5400 */
function _parseTimeSecs(time) {
    if (!time) return 0;
    const s = String(time).trim();
    if (s.includes(':')) {
        const parts = s.split(':').map(Number);
        if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
        if (parts.length === 2) return parts[0]*60 + parts[1];
    }
    const n = parseInt(s, 10);
    return isNaN(n) ? 0 : n * 60; // düzce sayı ise dakika kabul et
}

/** Editörü read-only veya yazılabilir yapar */
function _setEditorReadOnly(readonly) {
    if (monacoEditor) {
        monacoEditor.updateOptions({ readOnly: readonly });
    }
}

/**
 * API'dan gelen soruları yerel `questions` dizisine çevirir
 * ve mevcut soru sistemini çalıştırır.
 */
function _loadQuestionsFromApi(questionsObj, examData) {
    // Dil: API'dan gelen language alanı
    const lang = (examData.language || 'python').toLowerCase();
    if (['python', 'cpp', 'csharp'].includes(lang)) {
        currentLanguage = lang === 'csharp' ? 'cpp' : lang;
        const sel = document.getElementById('languageSelect');
        if (sel) sel.value = currentLanguage;
    }

    // soruları yeniden oluştur
    questions.length = 0;  // dizini temizle
    Object.keys(questionsObj).forEach((key, idx) => {
        const q = questionsObj[key];
        const examples = (q['test-cases'] || []).map((tc, i) => ({
            input       : tc.input  ?? '',
            output      : tc.output ?? '',
            explanation : ''
        }));
        questions.push({
            id          : parseInt(key, 10) || (idx + 1),
            title       : q.title || `Soru ${key}`,
            difficulty  : 'medium',
            points      : q.points || 0,
            category    : '',
            description : q.description || '',
            examples,
            constraints : [
                `Çalışma süresi sınırı: ${q['run-time-limit']} saniye`,
                `Bellek sınırı: ${q['memory-limit']} MB`,
            ],
            starterCode : {
                python : `# Kodunuzu buraya yazın\n`,
                cpp    : `// Kodunuzu buraya yazın\n`,
                java   : `// Kodunuzu buraya yazın\n`,
                c      : `// Kodunuzu buraya yazın\n`,
            }
        });
    });

    // Tab + soru panelini güncelle
    currentQuestion = 0;
    initializeTabs();
    loadQuestion(0);
}
