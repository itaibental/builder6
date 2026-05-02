import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, where, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyALZyRVu3NaH4HaH8DbthySORQYLMdbTng",
  authDomain: "build6.firebaseapp.com",
  projectId: "build6",
  storageBucket: "build6.firebasestorage.app",
  messagingSenderId: "629462460886",
  appId: "1:629462460886:web:a9376590cc03a4fb849c77"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const CloudService = {
    async uploadExam(examData) {
        // מפריד בין מטא-דאטה קל לבין תוכן כבד (HTML + state)
        const { htmlContent, state, ...lightData } = examData;
        const examRef = await addDoc(collection(db, "exams"), lightData);
        // שומר את התוכן הכבד ב-subcollection נפרד
        await setDoc(doc(db, "exams", examRef.id, "content", "main"), { htmlContent, state });
        return examRef;
    },
    async updateExam(examID, examData) {
        const { htmlContent, state, ...lightData } = examData;
        await setDoc(doc(db, "exams", examID), lightData, { merge: true });
        await setDoc(doc(db, "exams", examID, "content", "main"), { htmlContent, state });
    },
    async deleteExam(examID) {
        return await deleteDoc(doc(db, "exams", examID));
    },
    async saveStudents(studentList) {
        const promises = studentList.map(student => setDoc(doc(db, "students", student.id), student));
        return Promise.all(promises);
    },
    async getStudents() {
        const querySnapshot = await getDocs(collection(db, "students"));
        return querySnapshot.docs.map(doc => doc.data());
    },
    async deleteStudent(studentID) {
        return await deleteDoc(doc(db, "students", studentID));
    },
    async verifyStudent(studentID) {
        const studentDoc = await getDoc(doc(db, "students", studentID));
        return studentDoc.exists() ? studentDoc.data() : null;
    },
    async getActiveExams() {
        const q = query(collection(db, "exams"), where("active", "==", true));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(d => {
            const { htmlContent, state, ...light } = d.data();
            return { id: d.id, ...light };
        });
    },
    async getAllExams() {
        // מחזיר את כל המבחנים (פעילים וכבויים) לפאנל הניהול
        const querySnapshot = await getDocs(collection(db, "exams"));
        return querySnapshot.docs.map(d => {
            const { htmlContent, state, ...light } = d.data();
            return { id: d.id, ...light };
        });
    },
    async toggleExamActive(examID, currentActive) {
        return await setDoc(doc(db, "exams", examID), { active: !currentActive }, { merge: true });
    },
    async getExam(examID) {
        // שולף תוכן + state מה-subcollection (לצורך עריכה / הרצה)
        const contentRef = doc(db, "exams", examID, "content", "main");
        const contentSnap = await getDoc(contentRef);
        if (contentSnap.exists()) return contentSnap.data();
        // fallback למבחנים ישנים שנשמרו בפורמט הישן
        const docRef = doc(db, "exams", examID);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    },
    async getExamHtml(examID) {
        // שולף רק את ה-HTML (לצורך הרצת המבחן)
        const contentRef = doc(db, "exams", examID, "content", "main");
        const contentSnap = await getDoc(contentRef);
        if (contentSnap.exists()) return contentSnap.data().htmlContent || null;
        // fallback
        const docRef = doc(db, "exams", examID);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data().htmlContent || null) : null;
    },
    async saveSubmission(submissionData) {
        const id = `${submissionData.studentID}_${submissionData.examID}`;
        return await setDoc(doc(db, "submissions", id), submissionData, { merge: true });
    },
    async getSubmissions() {
        const querySnapshot = await getDocs(collection(db, "submissions"));
        // מחזיר רק שדות קלים - ללא תוכן התשובות שיכול להיות כבד מאוד
        return querySnapshot.docs.map(d => {
            const { answers, parts, questions, htmlContent, ...light } = d.data();
            return { id: d.id, ...light };
        });
    },
    async getSubmission(subID) {
        const docRef = doc(db, "submissions", subID);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    },
    // הפונקציה החדשה: מחיקת הגשה של תלמיד מהמאגר
    async deleteSubmission(subID) {
        return await deleteDoc(doc(db, "submissions", subID));
    }
};
