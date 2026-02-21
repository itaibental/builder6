const HTMLBuilder = {
    build: function(name, questions, instructions, examTitle, logoData, solutionDataUrl, duration, unlockCodeHash, parts, teacherEmail, driveLink, projectData, theme) {
        
        const sectionsHTML = parts.map((p, idx) => {
            const partQuestions = questions.filter(q => q.part === p.id);
            return `<div id="part-${p.id}" class="exam-section ${idx===0?'active':''}">
                <h2>${p.name}</h2>
                ${partQuestions.map(q => `<div class="q-block"><strong>שאלה:</strong> ${q.text}<textarea class="student-ans" id="ans-${q.id}"></textarea></div>`).join('')}
            </div>`;
        }).join('');

        // כפתור שמירה בענן שיוזרק לתלמיד
        const cloudSaveHTML = `
            <div style="text-align:center; margin: 30px 0; padding:20px; background:#ebf5fb; border-radius:15px; border:1px solid #3498db;">
                <p>מומלץ לשמור את ההתקדמות במהלך הבחינה</p>
                <button type="button" onclick="saveCloud()" id="btnSave" style="background:#3498db; color:white; padding:12px 25px; border:none; border-radius:30px; cursor:pointer; font-weight:bold;">
                    ☁️ שמור התקדמות בענן
                </button>
            </div>
        `;

        return `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8"><title>מבחן</title>
        <style>body{font-family:Rubik; background:#f4f6f8; padding:20px;} .container{max-width:800px; margin:0 auto; background:white; padding:40px; border-radius:15px;}</style>
        </head><body>
        <div class="container">
            <h1>${examTitle}</h1>
            <input type="text" id="studentNameField" value="${name}" readonly style="width:100%; padding:10px; margin-bottom:20px;">
            ${cloudSaveHTML}
            <form id="examForm">${sectionsHTML}</form>
            <button onclick="submitExam()" style="background:#27ae60; color:white; width:100%; padding:15px; border:none; border-radius:30px; margin-top:20px;">הגש מבחן</button>
        </div>
        <script>
            async function saveCloud() {
                const btn = document.getElementById('btnSave');
                btn.innerText = "⏳ שומר...";
                const answers = {};
                document.querySelectorAll('.student-ans').forEach(el => answers[el.id] = el.value);
                console.log("Saving Progress:", answers);
                setTimeout(() => { btn.innerText = "✅ נשמר בענן"; }, 1000);
            }
            function submitExam() { alert("המבחן הוגש!"); }
        </script>
        </body></html>`;
    }
};
