const App = {
    init: function() {
        UI.initElements();
        
        if(ExamState.parts.length === 0) {
            this.addPart();
        } else {
            UI.renderTabs();
            this.setTab(ExamState.parts[0].id);
        }
        
        if(UI.elements.examTitleInput) UI.elements.examTitleInput.value = ExamState.examTitle;
        if(UI.elements.previewExamTitle) UI.elements.previewExamTitle.textContent = ExamState.examTitle;
        if(UI.elements.examInstructions) UI.elements.examInstructions.value = ExamState.instructions.general;
        if(UI.elements.examDurationInput) UI.elements.examDurationInput.value = 90;
        
        if (UI.elements.bgColorInput) UI.elements.bgColorInput.value = ExamState.theme.background;
        if (UI.elements.headerColorInput) UI.elements.headerColorInput.value = ExamState.theme.header;
        UI.applyTheme();

        Utils.setupResizers();
    },

    updateTheme: function(type, value) {
        if(type === 'background') ExamState.theme.background = value;
        if(type === 'header') ExamState.theme.header = value;
        UI.applyTheme();
    },

    addNewQuestionToCurrentPart: function() {
        const currentPart = ExamState.getCurrentPart();
        if (!currentPart) {
            UI.showToast('יש לבחור פרק תחילה', 'error');
            return;
        }
        const question = {
            id: Date.now(),
            part: currentPart.id,
            points: 10,
            text: '',
            modelAnswer: '',
            videoUrl: '',
            imageUrl: '',
            videoOptions: { showControls: true, modestBranding: true, showRelated: false },
            subQuestions: []
        };
        ExamState.addQuestion(question);
        UI.updateStats();
        UI.renderPreview();
        setTimeout(() => {
            const container = document.getElementById('previewQuestionsContainer');
            container.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    },

    updateQuestionField: function(id, field, value) {
        const q = ExamState.questions.find(q => q.id === id);
        if(q) {
            q[field] = value;
            if(field === 'points') UI.updateStats();
        }
    },

    deleteQuestion: function(id) {
        UI.showConfirm('מחיקת שאלה', 'האם למחוק את השאלה לצמיתות?', () => {
            ExamState.removeQuestion(id);
            UI.updateStats();
            UI.renderPreview();
            UI.showToast('השאלה נמחקה');
        });
    },

    duplicateQuestion: function(id) {
        const original = ExamState.questions.find(q => q.id === id);
        if(!original) return;
        const copy = JSON.parse(JSON.stringify(original));
        copy.id = Date.now();
        const index = ExamState.questions.findIndex(q => q.id === id);
        ExamState.questions.splice(index + 1, 0, copy);
        UI.updateStats();
        UI.renderPreview();
    },

    addSubQuestion: function(qId) {
        const q = ExamState.questions.find(q => q.id === qId);
        if(!q) return;
        if(!q.subQuestions) q.subQuestions = [];
        q.subQuestions.push({
            id: Date.now(),
            text: '',
            points: 5,
            modelAnswer: '',
            imageUrl: '',
            videoUrl: ''
        });
        UI.renderPreview(); 
    },

    deleteSubQuestion: function(qId, subId) {
        const q = ExamState.questions.find(q => q.id === qId);
        if(q && q.subQuestions) {
            q.subQuestions = q.subQuestions.filter(sq => sq.id !== subId);
            UI.renderPreview();
        }
    },

    updateSubQuestionField: function(qId, subId, field, value) {
        const q = ExamState.questions.find(q => q.id === qId);
        const sq = q?.subQuestions?.find(s => s.id === subId);
        if(sq) {
            if (field === 'points') {
                sq.points = parseInt(value) || 0;
            } else {
                sq[field] = value;
            }
        }
    },

    addPart: function() {
        const nextIdx = ExamState.parts.length;
        let suffix = "";
        if (nextIdx < ExamState.partNamesList.length) suffix = ExamState.partNamesList[nextIdx];
        else suffix = (nextIdx + 1).toString();
        const newId = ExamState.getNextPartId();
        const newName = "פרק " + suffix;
        ExamState.addPart({ id: newId, name: newName });
        UI.renderTabs();
        this.setTab(newId);
        UI.showToast(`פרק חדש נוסף: ${newName}`);
    },

    setTab: function(partId) {
        ExamState.currentTab = partId;
        UI.renderTabs();
        UI.renderPreview();
    },

    updatePartNameInternal: function(value) {
        const currentPart = ExamState.getCurrentPart();
        if (currentPart) {
            ExamState.updatePartName(currentPart.id, value);
            UI.renderTabs(); 
        }
    },

    removePart: function() {
        if (ExamState.parts.length <= 1) {
            UI.showToast('חייב להישאר לפחות פרק אחד.', 'error');
            return;
        }
        const currentPart = ExamState.getCurrentPart();
        if(!currentPart) return;

        UI.showConfirm('מחיקת פרק', 'האם למחוק את הפרק הנוכחי? כל השאלות בפרק יימחקו.', () => {
            ExamState.removePart(currentPart.id);
            const newTabId = ExamState.parts[0]?.id;
            if (newTabId) {
                this.setTab(newTabId);
            } else {
                this.addPart();
            }
            UI.updateStats();
        });
    },

    updatePartInstructionsFromPreview: function(value) {
        const currentPart = ExamState.getCurrentPart();
        if (currentPart) {
            ExamState.instructions.parts[currentPart.id] = value;
        }
    },

    updateExamTitle: function() {
        const val = UI.elements.examTitleInput.value;
        ExamState.examTitle = val || 'מבחן בגרות';
        if(UI.elements.previewExamTitle) UI.elements.previewExamTitle.textContent = ExamState.examTitle;
    },

    updateGeneralInstructions: function(val) {
        ExamState.instructions.general = val;
    },

    saveProject: function() {
        try {
            const projectData = {
                state: ExamState.getSavableState(),
                meta: {
                    duration: UI.elements.examDurationInput?.value || 90,
                    unlockCode: UI.elements.unlockCodeInput?.value || '',
                    teacherEmail: UI.elements.teacherEmailInput?.value || '',
                    driveLink: UI.elements.driveFolderInput?.value || '',
                    examTitle: ExamState.examTitle,
                    generalInstructions: ExamState.instructions.general
                },
                timestamp: Date.now()
            };
            const dataStr = JSON.stringify(projectData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `exam-draft-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            UI.showToast('טיוטת המבחן נשמרה בהצלחה!');
        } catch (e) {
            console.error("Save Error:", e);
            UI.showToast('שגיאה בשמירת הטיוטה: ' + e.message, 'error');
        }
    },

    handleProjectLoad: function(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let loaded;
                if (file.name.endsWith('.html')) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(e.target.result, 'text/html');
                    const scriptTag = doc.getElementById('exam-engine-data');
                    if (scriptTag && scriptTag.textContent) {
                        loaded = JSON.parse(scriptTag.textContent);
                    } else {
                        throw new Error("לא נמצא מידע פרויקט בקובץ ה-HTML זה.");
                    }
                } else {
                    loaded = JSON.parse(e.target.result);
                }
                
                ExamState.loadState(loaded.state);

                if (loaded.meta) {
                    if (UI.elements.examDurationInput) UI.elements.examDurationInput.value = loaded.meta.duration || 90;
                    if (UI.elements.unlockCodeInput) UI.elements.unlockCodeInput.value = loaded.meta.unlockCode || '';
                    if (UI.elements.teacherEmailInput) UI.elements.teacherEmailInput.value = loaded.meta.teacherEmail || '';
                    if (UI.elements.driveFolderInput) UI.elements.driveFolderInput.value = loaded.meta.driveLink || '';
                    if (UI.elements.examTitleInput) UI.elements.examTitleInput.value = loaded.meta.examTitle || ExamState.examTitle;
                }

                if (ExamState.logoData && UI.elements.previewLogo) {
                    UI.elements.previewLogo.src = ExamState.logoData;
                    UI.elements.previewLogo.style.display = 'block';
                    if(document.getElementById('logoStatus')) document.getElementById('logoStatus').textContent = 'לוגו נטען';
                }
                if (UI.elements.previewExamTitle) UI.elements.previewExamTitle.textContent = ExamState.examTitle;
                if (UI.elements.examInstructions) UI.elements.examInstructions.value = ExamState.instructions.general;
                
                if (UI.elements.bgColorInput) UI.elements.bgColorInput.value = ExamState.theme.background;
                if (UI.elements.headerColorInput) UI.elements.headerColorInput.value = ExamState.theme.header;
                
                this.init(); // Re-initialize the app with the new state
                UI.showToast('המבחן נטען בהצלחה!');

            } catch (err) {
                console.error(err);
                UI.showToast('שגיאה בטעינת הקובץ: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; 
    },

    handleLogoUpload: function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                ExamState.logoData = e.target.result;
                UI.elements.previewLogo.src = ExamState.logoData;
                UI.elements.previewLogo.style.display = 'block';
                if(document.getElementById('logoStatus')) document.getElementById('logoStatus').textContent = 'לוגו נטען';
            };
            reader.readAsDataURL(file);
        }
    },

    handleStudentListUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;
        Papa.parse(file, {
            complete: function(results) {
                ExamState.allowedIds = results.data.flat().filter(id => id.trim() !== '');
                document.getElementById('studentListStatus').textContent = `${ExamState.allowedIds.length} ת.ז. נטענו`;
                UI.showToast('רשימת התלמידים נטענה בהצלחה');
            },
            error: function(err) {
                UI.showToast(`שגיאה בקריאת הקובץ: ${err.message}`, 'error');
            }
        });
    },

    publishOnline: async function() {
        if (ExamState.allowedIds.length === 0) {
            UI.showToast('יש לטעון רשימת ת.ז. לפני הפרסום', 'error');
            return;
        }

        const examData = {
            title: ExamState.examTitle,
            examState: ExamState.getSavableState(),
            allowedIds: ExamState.allowedIds,
            createdAt: new Date()
        };

        try {
            const docRef = await db.collection('publishedExams').add(examData);
            const examLink = `${window.location.origin}/exam.html?id=${docRef.id}`;
            
            const statusDiv = document.getElementById('publishStatus');
            const linkInput = document.getElementById('examLink');
            linkInput.value = examLink;
            statusDiv.style.display = 'block';

            UI.showToast('המבחן פורסם בהצלחה!', 'success');
        } catch (error) {
            console.error("Error publishing exam: ", error);
            UI.showToast('שגיאה בפרסום המבחן', 'error');
        }
    },

    copyLink: function() {
        const linkInput = document.getElementById('examLink');
        linkInput.select();
        document.execCommand('copy');
        UI.showToast('הקישור הועתק!');
    },
    
    applyFormat: function(tag) {
        const activeEl = document.activeElement;
        
        if (!activeEl || (activeEl.tagName !== 'TEXTAREA' && (activeEl.tagName !== 'INPUT' || activeEl.type !== 'text'))) {
            UI.showToast('אנא סמן טקסט בתוך תיבה', 'error');
            return;
        }

        const start = activeEl.selectionStart;
        const end = activeEl.selectionEnd;
        const text = activeEl.value;
        const selectedText = text.substring(start, end);
        
        if (!selectedText) {
            return;
        }
        
        const newText = text.substring(0, start) + `<${tag}>${selectedText}</${tag}>` + text.substring(end);
        activeEl.value = newText;
        
        activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        
        activeEl.focus();
        activeEl.setSelectionRange(start, end + tag.length * 2 + 3 + 2);
    }
};

window.onload = function() {
    App.init();
};
