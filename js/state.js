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

    // Method to get current part object
    getCurrentPart: function() {
        return this.parts.find(p => p.id === this.currentTab);
    },

    addPart: function(part) {
        this.parts.push(part);
        this.partCounter = Math.max(this.partCounter, this.parts.length);
    },

    removePart: function(partId) {
        this.parts = this.parts.filter(p => p.id !== partId);
        this.questions = this.questions.filter(q => q.part !== partId);
        delete this.instructions.parts[partId];
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
    },

    // A method to return a clean, savable state
    getSavableState: function() {
        return {
            examTitle: this.examTitle,
            parts: this.parts,
            questions: this.questions,
            instructions: this.instructions,
            theme: this.theme,
            logoData: this.logoData,
            partCounter: this.partCounter,
            allowedIds: this.allowedIds
        };
    },
    
    // A method to load state from a saved project
    loadState: function(savedState) {
        this.examTitle = savedState.examTitle || 'מבחן בגרות';
        this.parts = savedState.parts || [];
        this.questions = savedState.questions || [];
        this.instructions = savedState.instructions || { general: '', parts: {} };
        this.theme = savedState.theme || { background: '#f4f6f8', header: '#2c3e50' };
        this.logoData = savedState.logoData || null;
        this.partCounter = savedState.partCounter || 0;
        this.allowedIds = savedState.allowedIds || [];
        
        if (this.parts.length > 0) {
            this.currentTab = this.parts[0].id;
        } else {
            this.currentTab = null;
        }
    }
};