# Exam Workflow Cheatsheet

Everything runs through the browser console. Make sure you're logged in as admin first.

---

## 1. Start the App

```bash
docker-compose up --build
```

Admin login link is printed in the terminal on startup:
```
Link: http://localhost/login?token=<your_token>
```

Open that link in the browser to log in as admin.

---

## 2. Start the Exam (Warms Up Containers)

Run this in the browser console. Must be done before students submit.

```javascript
fetch('/api/admin/start_exam', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ language: 'python' })
}).then(r => r.json()).then(console.log)
```

Supported languages: `"python"`, `"cpp"`, `"csharp"`

---

## 3. Upload Test Cases

Run once per question, per exam. Test case files are saved to `grader/test_cases/<exam_id>/`.

```javascript
fetch('/api/admin/exam/exam_001/tests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question_id: 'q1',        // q1, q2, q3, q4, q5
    tests: [
      { input: '5\n3', expected: '8' },
      { input: '10\n20', expected: '30' }
    ]
  })
}).then(r => r.json()).then(console.log)
```

- `input` is what gets fed to stdin — use `\n` to simulate pressing Enter between inputs
- `expected` is exactly what the program should print to stdout (whitespace is trimmed automatically)
- Repeat for each question, changing `question_id` and `tests`

---

## 4. View Student Results

```javascript
fetch('/api/admin/exam/exam_001/results')
  .then(r => r.json()).then(console.log)
```

Each submission contains:
- `student_id` — student's school number
- `submitted_at` — timestamp
- `questions` — array of each question with:
  - `code` — what the student wrote
  - `tests` — array of `true`/`false` per test case

Count the `true`s for the score. No scores are pre-computed.

---

## 5. File Structure

```
grader/
  test_cases/
    exam_001/
      q1.json    ← created by upload endpoint
      q2.json
      ...
  submissions/
    exam_001/
      2512729006.json    ← created on student submit, blocks re-submission
```

**Never commit these folders to git** — they're already in `.gitignore`.

---

## 6. Changing the Exam ID

Currently hardcoded as `exam_001` in two places:

- `frontend_client/index.html` — `const EXAM_ID = "exam_001";`
- All the console commands above

Change both when you add multiple exam support.

---

## Notes

- Students get only `"Submitted successfully"` — they see nothing else
- Submission is one-time — resubmitting returns 403
- To reset a student's submission, delete their file from `grader/submissions/exam_001/`
- Container pool only fills after `start_exam` is called — students can't submit before that
