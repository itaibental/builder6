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
    // מורה: העלאת מבחן לענן
  // מורה: העלאת מבחן לענן (כולל קוד ה-HTML המלא)
    async uploadExam(examData) {
        return await addDoc(collection(db, "exams"), examData);
    },

    // תלמיד: שליפת מבחן ספציפי מהענן לצורך פתרון
    async getExam(examID) {
        const docRef = doc(db, "exams", examID);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    },

    // מנהל: שמירת רשימת תלמידים מתוך קובץ אקסל או ידנית
    async saveStudents(studentList) {
        const promises = studentList.map(student => 
            setDoc(doc(db, "students", student.id), student)
        );
        return Promise.all(promises);
    },
// תלמיד: שליפת מבחן ספציפי מהענן לצורך פתרון
    async getExam(examID) {
        const docRef = doc(db, "exams", examID);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    },
    // מנהל: שליפת כל התלמידים מהמאגר לתצוגה
    async getStudents() {
        const querySnapshot = await getDocs(collection(db, "students"));
        return querySnapshot.docs.map(doc => doc.data());
    },

    // מנהל: מחיקת תלמיד מהמאגר
    async deleteStudent(studentID) {
        return await deleteDoc(doc(db, "students", studentID));
    },

    // תלמיד: אימות תעודת זהות מול הרשימה המאושרת בענן
    async verifyStudent(studentID) {
        const studentDoc = await getDoc(doc(db, "students", studentID));
        return studentDoc.exists() ? studentDoc.data() : null;
    },

    // תלמיד: שליפת רשימת מבחנים זמינים (פעילים)
    async getActiveExams() {
        const q = query(collection(db, "exams"), where("active", "==", true));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // תלמיד: שמירת ההתקדמות / ההגשה של הבחינה
    async saveSubmission(submissionData) {
        const id = `${submissionData.studentID}_${submissionData.examID}`;
        return await setDoc(doc(db, "submissions", id), submissionData, { merge: true });
    },

    // מנהל/מורה: שליפת הגשות לצורך בדיקה או מעקב בזמן אמת
    async getSubmissions() {
        const querySnapshot = await getDocs(collection(db, "submissions"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};
