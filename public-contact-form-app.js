// IMPORTANT: Copy your Firebase project configuration here
const firebaseConfig = {
    apiKey: "AIzaSyCzDXmXTv3_IH5eE2BVRqz3ugC-u9cRnBk", // Replace with your actual API key
    authDomain: "toenes-37371.firebaseapp.com", // Replace with your actual auth domain
    projectId: "toenes-37371", // Replace with your actual project ID
    storageBucket: "toenes-37371.firebasestorage.app", // Replace with your actual storage bucket
    messagingSenderId: "548891515922", // Replace with your actual messaging sender ID
    appId: "1:548891515922:web:1bfe426e4b486e35bb4ccb", // Replace with your actual app ID
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const contactsCollection = db.collection('contacts');

// DOM Elements
const publicContactForm = document.getElementById('publicContactForm');
const publicContactNameInput = document.getElementById('publicContactName');
const publicContactEmailInput = document.getElementById('publicContactEmail');
const publicContactPhoneInput = document.getElementById('publicContactPhone');
const contactSubmissionMessage = document.getElementById('contactSubmissionMessage');

let adminUidFromUrl = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    adminUidFromUrl = urlParams.get('adminUid');
    if (!adminUidFromUrl) {
        console.warn("Admin UID not provided in URL. Submissions will not be directly associated with an admin account.");
        // Optionally, you could hide the form or show a message if adminUid is strictly required.
    }
});
publicContactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = publicContactNameInput.value.trim();
    const email = publicContactEmailInput.value.trim();
    const phone = publicContactPhoneInput.value.trim();

    if (!name) {
        contactSubmissionMessage.className = 'alert alert-danger'; // Bootstrap class
        contactSubmissionMessage.textContent = "Name is required.";
        // contactSubmissionMessage.style.color = 'red'; // Handled by alert-danger
        contactSubmissionMessage.style.display = 'block';
        return;
    }

    const contactData = {
        name: name,
        email: email,
        phone: phone,
        source: 'public_form', // To identify contacts added via this form
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (adminUidFromUrl) {
        contactData.ownerAdminUid = adminUidFromUrl; // Associate with the admin who shared the link
    }

    const submitButton = publicContactForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
        await contactsCollection.add(contactData);
        publicContactForm.reset();
        contactSubmissionMessage.className = 'alert alert-success'; // Bootstrap class
        contactSubmissionMessage.textContent = 'Thank you! Your contact information has been submitted.';
    } catch (error) {
        console.error("Error submitting contact: ", error);
        contactSubmissionMessage.className = 'alert alert-danger'; // Bootstrap class
        contactSubmissionMessage.textContent = "Error submitting contact: " + error.message;
    } finally {
        contactSubmissionMessage.style.display = 'block';
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Contact';
    }
});