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
        return await addDoc(collection(db, "exams"), examData);
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
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async getExam(examID) {
        const docRef = doc(db, "exams", examID);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    },
    async saveSubmission(submissionData) {
        const id = `${submissionData.studentID}_${submissionData.examID}`;
        return await setDoc(doc(db, "submissions", id), submissionData, { merge: true });
    },
    async getSubmissions() {
        const querySnapshot = await getDocs(collection(db, "submissions"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async getSubmission(subID) {
        const docRef = doc(db, "submissions", subID);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    }
};
