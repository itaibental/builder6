// firebase-service.js v1.5.27 — cache-bust
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, where, getDoc, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ---- Cache פנימי (30 שניות TTL) ----
const CACHE_TTL = 30_000;
const _cache = {};
function cacheGet(key) {
    const entry = _cache[key];
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    return null;
}
function cacheSet(key, data) { _cache[key] = { data, ts: Date.now() }; }
function cacheInvalidate(...keys) { keys.forEach(k => delete _cache[k]); }

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
        const { htmlContent, state, ...lightData } = examData;
        const examRef = await addDoc(collection(db, "exams"), lightData);
        await setDoc(doc(db, "exams", examRef.id, "content", "main"), { htmlContent, state });
        cacheInvalidate('allExams', 'activeExams');
        return examRef;
    },
    async updateExam(examID, examData) {
        const { htmlContent, state, ...lightData } = examData;
        await setDoc(doc(db, "exams", examID), lightData, { merge: true });
        await setDoc(doc(db, "exams", examID, "content", "main"), { htmlContent, state });
        cacheInvalidate('allExams', 'activeExams');
    },
    async deleteExam(examID) {
        cacheInvalidate('allExams', 'activeExams');
        return await deleteDoc(doc(db, "exams", examID));
    },

    // ---- שכפול מבחן ----
    async duplicateExam(examID) {
        const [meta, content] = await Promise.all([
            getDoc(doc(db, "exams", examID)),
            getDoc(doc(db, "exams", examID, "content", "main"))
        ]);
        if (!meta.exists()) throw new Error("מבחן לא נמצא");
        const { id: _id, ...metaData } = { id: examID, ...meta.data() };
        const newMeta = { ...metaData, title: (metaData.title || 'מבחן') + ' (עותק)', createdAt: Date.now(), active: false };
        const newRef = await addDoc(collection(db, "exams"), newMeta);
        if (content.exists()) {
            await setDoc(doc(db, "exams", newRef.id, "content", "main"), content.data());
        }
        cacheInvalidate('allExams', 'activeExams');
        return newRef.id;
    },

    async saveStudents(studentList) {
        const promises = studentList.map(student => setDoc(doc(db, "students", student.id), student));
        cacheInvalidate('students');
        return Promise.all(promises);
    },
    async getStudents() {
        const cached = cacheGet('students');
        if (cached) return cached;
        const querySnapshot = await getDocs(collection(db, "students"));
        const result = querySnapshot.docs.map(d => d.data());
        cacheSet('students', result);
        return result;
    },
    async deleteStudent(studentID) {
        cacheInvalidate('students');
        return await deleteDoc(doc(db, "students", studentID));
    },
    async verifyStudent(studentID) {
        const studentDoc = await getDoc(doc(db, "students", studentID));
        return studentDoc.exists() ? studentDoc.data() : null;
    },
    async getActiveExams() {
        const cached = cacheGet('activeExams');
        if (cached) return cached;
        const q = query(collection(db, "exams"), where("active", "==", true));
        const querySnapshot = await getDocs(q);
        const result = querySnapshot.docs.map(d => {
            const { htmlContent, state, ...light } = d.data();
            return { id: d.id, ...light };
        });
        cacheSet('activeExams', result);
        return result;
    },
    async getAllExams() {
        const cached = cacheGet('allExams');
        if (cached) return cached;
        const querySnapshot = await getDocs(collection(db, "exams"));
        const result = querySnapshot.docs.map(d => {
            const { htmlContent, state, ...light } = d.data();
            return { id: d.id, ...light };
        });
        cacheSet('allExams', result);
        return result;
    },
    async toggleExamActive(examID, currentActive) {
        cacheInvalidate('allExams', 'activeExams');
        return await setDoc(doc(db, "exams", examID), { active: !currentActive }, { merge: true });
    },
    async getExam(examID) {
        const contentRef = doc(db, "exams", examID, "content", "main");
        const contentSnap = await getDoc(contentRef);
        if (contentSnap.exists()) return contentSnap.data();
        const docRef = doc(db, "exams", examID);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    },
    async getExamHtml(examID) {
        const contentRef = doc(db, "exams", examID, "content", "main");
        const contentSnap = await getDoc(contentRef);
        if (contentSnap.exists()) return contentSnap.data().htmlContent || null;
        const docRef = doc(db, "exams", examID);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data().htmlContent || null) : null;
    },
    async saveSubmission(submissionData) {
        const id = `${submissionData.studentID}_${submissionData.examID}`;
        cacheInvalidate('submissions');
        return await setDoc(doc(db, "submissions", id), submissionData, { merge: true });
    },
    async getSubmissions() {
        const cached = cacheGet('submissions');
        if (cached) return cached;
        const querySnapshot = await getDocs(collection(db, "submissions"));
        const result = querySnapshot.docs.map(d => {
            const { answers, parts, questions, htmlContent, ...light } = d.data();
            return { id: d.id, ...light };
        });
        cacheSet('submissions', result);
        return result;
    },
    async getSubmission(subID) {
        const docRef = doc(db, "submissions", subID);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    },
    async deleteSubmission(subID) {
        cacheInvalidate('submissions');
        return await deleteDoc(doc(db, "submissions", subID));
    },

    // ---- שמירת snapshot כל 10 דקות ----
    async saveSnapshot(studentID, examID, answers) {
        const ts = Date.now();
        const snapRef = doc(db, "submissions", `${studentID}_${examID}`, "snapshots", String(ts));
        await setDoc(snapRef, { answers, savedAt: ts });
        return ts;
    },
    async getSnapshots(studentID, examID) {
        const snapsRef = collection(db, "submissions", `${studentID}_${examID}`, "snapshots");
        const snap = await getDocs(snapsRef);
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => Number(b.savedAt) - Number(a.savedAt));
    },

    // ---- טעינה מקבילית של כל נתוני הדשבורד ----
    async getDashboardData() {
        const [students, exams, submissions] = await Promise.all([
            this.getStudents(),
            this.getAllExams(),
            this.getSubmissions()
        ]);
        return { students, exams, submissions };
    }
};
