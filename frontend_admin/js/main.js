        // Init
        updateButtons();
        restoreExamState();          // ← sayfa yenilenince durumu API'dan çek
        setInterval(fetchStudents, 5000);
        fetchStudents();


