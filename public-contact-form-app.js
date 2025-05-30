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

publicContactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = publicContactNameInput.value.trim();
    const email = publicContactEmailInput.value.trim();
    const phone = publicContactPhoneInput.value.trim();

    if (!name) {
        contactSubmissionMessage.textContent = "Name is required.";
        contactSubmissionMessage.style.color = 'red';
        contactSubmissionMessage.style.display = 'block';
        return;
    }

    const contactData = {
        name: name,
        email: email,
        phone: phone,
        source: 'public_form', // To identify contacts added via this form
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
        // No userId is associated with publicly added contacts
    };

    const submitButton = publicContactForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
        await contactsCollection.add(contactData);
        publicContactForm.reset();
        contactSubmissionMessage.textContent = 'Thank you! Your contact information has been submitted.';
        contactSubmissionMessage.style.color = 'green';
    } catch (error) {
        console.error("Error submitting contact: ", error);
        contactSubmissionMessage.textContent = "Error submitting contact: " + error.message;
        contactSubmissionMessage.style.color = 'red';
    } finally {
        contactSubmissionMessage.style.display = 'block';
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Contact';
    }
});