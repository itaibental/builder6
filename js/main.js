const App = {
    init: function() {
        UI.initElements();
        if(ExamState.parts.length === 0) this.addPart();
        UI.renderTabs();
        this.setTab(ExamState.parts[0].id);
        Utils.setupResizers();
    },

    async moveExamToCloud() {
        if (ExamState.questions.length === 0) return UI.showToast('אין שאלות במבחן', 'error');
        UI.showToast('מעלה למאגר הענן...', 'info');
        try {
            const { CloudService } = await import('./firebase-service.js');
            const result = await CloudService.uploadExam(ExamState);
            UI.showToast('המבחן הועלה בהצלחה! מזהה: ' + result.id);
        } catch (e) { UI.showToast('שגיאה בהעלאה', 'error'); }
    },

    addNewQuestionToCurrentPart: function() {
        const question = {
            id: Date.now(),
            part: ExamState.currentTab,
            points: 10,
            text: '',
            subQuestions: []
        };
        ExamState.addQuestion(question);
        UI.renderPreview();
        UI.updateStats();
    },

    updateExamTitle: function() {
        ExamState.examTitle = UI.elements.examTitleInput.value || 'מבחן בגרות';
        UI.elements.previewExamTitle.textContent = ExamState.examTitle;
    },

    setTab: function(id) {
        ExamState.currentTab = id;
        UI.renderTabs();
        UI.renderPreview();
    },

    addPart: function() {
        const id = ExamState.getNextPartId();
        ExamState.addPart({ id, name: "פרק חדש" });
        UI.renderTabs();
        this.setTab(id);
    },

    applyFormat: function(tag) {
        const el = document.activeElement;
        if (el.tagName !== 'TEXTAREA') return;
        const start = el.selectionStart, end = el.selectionEnd;
        const text = el.value;
        el.value = text.substring(0, start) + `<${tag}>` + text.substring(start, end) + `</${tag}>` + text.substring(end);
        el.dispatchEvent(new Event('input'));
    }
};

window.onload = () => App.init();
