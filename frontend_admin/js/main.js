        // Init
        updateButtons();
        restoreExamState().then(() => {
            if (typeof tmCheckStartup === 'function') {
                tmCheckStartup();
            }
        });
        setInterval(fetchStudents, 5000);
        fetchStudents();


