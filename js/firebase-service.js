import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, query, where, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    // העלאת מבחן למאגר (ממשק מורה)
    async uploadExam(examState) {
        const examData = {
            title: examState.examTitle,
            state: JSON.parse(JSON.stringify(examState)),
            active: true,
            createdAt: Date.now()
        };
        return await addDoc(collection(db, "exams"), examData);
    },

    // שמירת רשימת תלמידים (ממשק מנהל)
    async saveStudents(studentList) {
        const promises = studentList.map(student => 
            setDoc(doc(db, "students", student.id), student)
        );
        return Promise.all(promises);
    },

    // אימות תלמיד (ממשק תלמיד)
    async verifyStudent(studentID) {
        const studentDoc = await getDoc(doc(db, "students", studentID));
        return studentDoc.exists() ? studentDoc.data() : null;
    },

    // שליפת מבחנים פעילים (ממשק תלמיד)
    async getActiveExams() {
        const q = query(collection(db, "exams"), where("active", "==", true));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // שמירת התקדמות/הגשה של תלמיד
    async saveSubmission(submissionData) {
        const id = `${submissionData.studentID}_${submissionData.examID}`;
        return await setDoc(doc(db, "submissions", id), submissionData, { merge: true });
    },

    // שליפת כל ההגשות למנהל/מורה
    async getSubmissions() {
        const querySnapshot = await getDocs(collection(db, "submissions"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};
