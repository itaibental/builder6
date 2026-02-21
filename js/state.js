const ExamState = {
    examTitle: 'מבחן בגרות',
    parts: [],
    questions: [],
    instructions: {
        general: '',
        parts: {}
    },
    theme: {
        background: '#f4f6f8',
        header: '#2c3e50'
    },
    logoData: null,
    currentTab: null,
    partCounter: 0,
    allowedIds: [], // Added for online publishing

    partNamesList: ["ראשון", "שני", "שלישי", "רביעי", "חמישי"],

    addPart: function(part) {
        this.parts.push(part);
    },

    removePart: function(partId) {
        this.parts = this.parts.filter(p => p.id !== partId);
        this.questions = this.questions.filter(q => q.part !== partId);
    },

    updatePartName: function(partId, newName) {
        const part = this.parts.find(p => p.id === partId);
        if (part) part.name = newName;
    },

    addQuestion: function(question) {
        this.questions.push(question);
    },

    removeQuestion: function(questionId) {
        this.questions = this.questions.filter(q => q.id !== questionId);
    },

    getNextPartId: function() {
        this.partCounter++;
        return 'P' + this.partCounter;
    }
};