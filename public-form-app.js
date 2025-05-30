// IMPORTANT: Copy your Firebase project configuration here
const firebaseConfig = {
    apiKey: "AIzaSyCzDXmXTv3_IH5eE2BVRqz3ugC-u9cRnBk",
    authDomain: "toenes-37371.firebaseapp.com",
    projectId: "toenes-37371",
    storageBucket: "toenes-37371.firebasestorage.app",
    messagingSenderId: "548891515922",
    appId: "1:548891515922:web:1bfe426e4b486e35bb4ccb",
    measurementId: "G-P208FHJFR1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const formsCollection = db.collection('forms');
const formSubmissionsCollection = db.collection('form_submissions');

// DOM Elements
const publicFormTitle = document.getElementById('publicFormTitle');
const publicDynamicForm = document.getElementById('publicDynamicForm');
const submissionMessage = document.getElementById('submissionMessage');
const publicFormHeader = document.getElementById('publicFormHeader');

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('formId');

    if (formId) {
        loadAndRenderForm(formId);
    } else {
        publicFormTitle.textContent = "Form ID not provided.";
        publicFormHeader.textContent = "Error";
    }
});

async function loadAndRenderForm(formId) {
    try {
        const formDoc = await formsCollection.doc(formId).get();
        if (!formDoc.exists) {
            publicFormTitle.textContent = "Form not found.";
            publicFormHeader.textContent = "Error";
            return;
        }

        const formData = formDoc.data();
        publicFormTitle.textContent = formData.title;
        publicFormHeader.textContent = formData.title; // Set header too
        publicDynamicForm.innerHTML = ''; // Clear previous form

        formData.fields.forEach(field => {
            const fieldWrapper = document.createElement('div');
            fieldWrapper.classList.add('form-group');

            const label = document.createElement('label');
            label.setAttribute('for', `public_${field.name}`);
            label.textContent = field.label;
            fieldWrapper.appendChild(label);

            let inputElement;
            if (field.type === 'textarea') {
                inputElement = document.createElement('textarea');
            } else {
                inputElement = document.createElement('input');
                inputElement.type = field.type;
            }

            inputElement.id = `public_${field.name}`; // Prefix to avoid ID clashes if styles are shared
            inputElement.name = field.name; // Keep original name for data structure
            if (field.placeholder) inputElement.placeholder = field.placeholder;
            // if (field.required) inputElement.required = true; // Consider adding 'required' to form definition

            fieldWrapper.appendChild(inputElement);
            publicDynamicForm.appendChild(fieldWrapper);
        });

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Submit';
        publicDynamicForm.appendChild(submitButton);

        publicDynamicForm.onsubmit = async (e) => {
            e.preventDefault();
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';

            const submissionData = {
                formId: formId,
                formTitle: formData.title,
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                data: {}
                // Note: No userId here as it's a public form
            };

            formData.fields.forEach(field => {
                const inputElement = document.getElementById(`public_${field.name}`);
                submissionData.data[field.name] = (inputElement.type === 'checkbox') ? inputElement.checked : inputElement.value;
            });

            try {
                await formSubmissionsCollection.add(submissionData);
                publicDynamicForm.style.display = 'none';
                submissionMessage.textContent = 'Thank you! Your response has been submitted.';
                submissionMessage.style.display = 'block';
            } catch (error) {
                console.error("Error submitting form: ", error);
                submissionMessage.textContent = "Error submitting form: " + error.message;
                submissionMessage.style.display = 'block';
                submissionMessage.style.color = 'red';
                submitButton.disabled = false;
                submitButton.textContent = 'Submit';
            }
        };

    } catch (error) {
        console.error("Error loading form: ", error);
        publicFormTitle.textContent = "Error loading form.";
        publicFormHeader.textContent = "Error";
    }
}