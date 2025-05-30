// Initialize Firebase
// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyCzDXmXTv3_IH5eE2BVRqz3ugC-u9cRnBk", // Replace with your actual API key
    authDomain: "toenes-37371.firebaseapp.com", // Replace with your actual auth domain
    projectId: "toenes-37371", // Replace with your actual project ID
    storageBucket: "toenes-37371.firebasestorage.app", // Replace with your actual storage bucket
    messagingSenderId: "548891515922", // Replace with your actual messaging sender ID
    appId: "1:548891515922:web:1bfe426e4b486e35bb4ccb", // Replace with your actual app ID
    measurementId: "G-P208FHJFR1" // Optional: Replace with your actual measurement ID
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const contactsCollection = db.collection('contacts');
const formsCollection = db.collection('forms'); // For form definitions
const formSubmissionsCollection = db.collection('form_submissions'); // For submitted form data

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userDetails = document.getElementById('userDetails');
const contactsSection = document.getElementById('contacts-section');
const contactForm = document.getElementById('contactForm');
const contactIdInput = document.getElementById('contactId'); // from contacts
const nameInput = document.getElementById('name'); // from contacts
const emailInput = document.getElementById('email'); // from contacts
const phoneInput = document.getElementById('phone'); // from contacts
const contactList = document.getElementById('contactList'); // from contacts

const formsSection = document.getElementById('forms-section');
const formDefinitionForm = document.getElementById('formDefinitionForm');
const formTitleInput = document.getElementById('formTitle');
const formFieldsContainer = document.getElementById('formFieldsContainer');
const addFormFieldBtn = document.getElementById('addFormFieldBtn');
const formsList = document.getElementById('formsList');

const createFormView = document.getElementById('create-form-view');
const listFormsView = document.getElementById('list-forms-view');
const fillFormView = document.getElementById('fill-form-view');
const fillFormTitle = document.getElementById('fillFormTitle');
const dynamicForm = document.getElementById('dynamicForm');
const backToFormsListBtn = document.getElementById('backToFormsListBtn');

const viewSubmissionsView = document.getElementById('view-submissions-view');
const submissionsViewTitle = document.getElementById('submissionsViewTitle');
const submissionsList = document.getElementById('submissionsList');
const submissionDetailView = document.getElementById('submissionDetailView');
const submissionDetailContent = document.getElementById('submissionDetailContent');
const backToSubmissionsListBtn = document.getElementById('backToSubmissionsListBtn');
const backToFormsListFromSubmissionsBtn = document.getElementById('backToFormsListFromSubmissionsBtn');

const sharePublicContactFormBtn = document.getElementById('sharePublicContactFormBtn');
let currentUid = null;

// Auth state listener
auth.onAuthStateChanged(user => {
    if (user) {
        currentUid = user.uid;
        userDetails.textContent = `Logged in as: ${user.email}`;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        contactsSection.style.display = 'block';
        formsSection.style.display = 'none';
        loadContacts();
        // loadForms() is called when navigating to forms section
    } else {
        currentUid = null;
        userDetails.textContent = 'Not logged in.';
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        contactsSection.style.display = 'none';
        formsSection.style.display = 'none';
        viewSubmissionsView.style.display = 'none';
        contactList.innerHTML = ''; // Clear contacts if logged out
        formsList.innerHTML = ''; // Clear forms if logged out
    }
});

// Navigation
document.getElementById('navContacts').addEventListener('click', () => {
    if (!currentUid) return;
    contactsSection.style.display = 'block';
    formsSection.style.display = 'none';
});

document.getElementById('navForms').addEventListener('click', () => {
    if (!currentUid) return;
    contactsSection.style.display = 'none';
    formsSection.style.display = 'block';
    createFormView.style.display = 'block'; // Show create form view by default
    listFormsView.style.display = 'block'; // Show list of forms
    fillFormView.style.display = 'none'; // Hide fill form view
    viewSubmissionsView.style.display = 'none';
    loadForms();
});


// Login
loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => console.error("Login failed:", error));
});

// Logout
logoutBtn.addEventListener('click', () => {
    auth.signOut().catch(error => console.error("Logout failed:", error));
});

// Contact Form Submission
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUid) {
        alert("Please log in to save contacts.");
        return;
    }

    const contactData = {
        name: nameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        userId: currentUid, // Associate contact with the logged-in user
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const id = contactIdInput.value;

    try {
        if (id) {
            // Update existing contact
            await contactsCollection.doc(id).update(contactData);
        } else {
            // Add new contact
            await contactsCollection.add(contactData);
        }
        contactForm.reset();
        contactIdInput.value = '';
        loadContacts();
    } catch (error) {
        console.error("Error saving contact: ", error);
        alert("Error saving contact: " + error.message);
    }
});

// Load Contacts
async function loadContacts() {
    if (!currentUid) return;

    contactList.innerHTML = 'Loading...';
    try {
        const snapshot = await contactsCollection.where("userId", "==", currentUid).orderBy("createdAt", "desc").get();
        if (snapshot.empty) {
            contactList.innerHTML = '<li>No contacts found.</li>';
            return;
        }
        let html = '';
        snapshot.forEach(doc => {
            const contact = doc.data();
            html += `
                <li data-id="${doc.id}">
                    ${contact.name} - ${contact.email || ''} - ${contact.phone || ''}
                    <button onclick="editContact('${doc.id}', '${contact.name}', '${contact.email || ''}', '${contact.phone || ''}')">Edit</button>
                    <button onclick="deleteContact('${doc.id}')">Delete</button>
                </li>`;
        });
        contactList.innerHTML = html;
    } catch (error) {
        console.error("Error loading contacts: ", error);
        contactList.innerHTML = '<li>Error loading contacts.</li>';
    }
}

// Edit Contact (populate form)
function editContact(id, name, email, phone) {
    contactIdInput.value = id;
    nameInput.value = name;
    emailInput.value = email;
    phoneInput.value = phone;
    window.scrollTo(0, 0); // Scroll to top to see the form
}

// Delete Contact
async function deleteContact(id) {
    if (!currentUid) return;
    if (confirm("Are you sure you want to delete this contact?")) {
        try {
            await contactsCollection.doc(id).delete();
            loadContacts();
        } catch (error) {
            console.error("Error deleting contact: ", error);
            alert("Error deleting contact: " + error.message);
        }
    }
}

sharePublicContactFormBtn.addEventListener('click', () => {
    const publicContactFormUrl = `${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))}/public-contact-form.html`;
    prompt("Share this link for public contact submission:", publicContactFormUrl);
});


// --- Forms Management ---

let fieldCounter = 0; // Counter for unique field IDs in form definition

addFormFieldBtn.addEventListener('click', () => {
    fieldCounter++;
    const fieldDiv = document.createElement('div');
    fieldDiv.classList.add('form-field-definition');
    fieldDiv.innerHTML = `
        <div>
            <label for="fieldLabel${fieldCounter}">Field Label:</label>
            <input type="text" id="fieldLabel${fieldCounter}" name="fieldLabel" placeholder="E.g., Full Name" required>
        </div>
        <div>
            <label for="fieldType${fieldCounter}">Field Type:</label>
            <select id="fieldType${fieldCounter}" name="fieldType">
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="tel">Phone</option>
                <option value="date">Date</option>
                <option value="textarea">Text Area</option>
                <option value="checkbox">Checkbox</option>
                <option value="number">Number</option>
                <!-- Consider adding 'select' with options later -->
            </select>
        </div>
        <button type="button" onclick="this.parentElement.remove()">Remove Field</button>
        <hr>
    `;
    formFieldsContainer.appendChild(fieldDiv);
});

formDefinitionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUid) {
        alert("Please log in to create forms.");
        return;
    }

    const title = formTitleInput.value.trim();
    const fields = [];
    const fieldElements = formFieldsContainer.querySelectorAll('.form-field-definition');

    fieldElements.forEach(fieldEl => {
        const labelInput = fieldEl.querySelector('input[name="fieldLabel"]');
        const typeSelect = fieldEl.querySelector('select[name="fieldType"]');
        if (labelInput && typeSelect) {
            const label = labelInput.value.trim();
            const type = typeSelect.value;
            if (label && type) {
                // Generate a unique name for the field, suitable for use as an HTML input name attribute
                const name = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '') + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                fields.push({ label, type, name });
            }
        }
    });

    if (!title) {
        alert("Please provide a form title.");
        return;
    }
    if (fields.length === 0) {
        alert("Please add at least one field to the form.");
        return;
    }

    const formDefinition = {
        title,
        fields,
        userId: currentUid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await formsCollection.add(formDefinition);
        alert("Form definition saved!");
        formDefinitionForm.reset();
        formFieldsContainer.innerHTML = '';
        fieldCounter = 0;
        loadForms();
    } catch (error) {
        console.error("Error saving form definition: ", error);
        alert("Error saving form: " + error.message);
    }
});

async function loadForms() {
    if (!currentUid) return;

    formsList.innerHTML = 'Loading forms...';
    try {
        const snapshot = await formsCollection.where("userId", "==", currentUid).orderBy("createdAt", "desc").get();
        if (snapshot.empty) {
            formsList.innerHTML = '<li>No forms defined yet. Create one!</li>';
            return;
        }
        let html = '';
        snapshot.forEach(doc => {
            const form = doc.data();
            html += `
                <li data-id="${doc.id}">
                    ${form.title}
                    <button onclick="renderFormForFilling('${doc.id}')">Fill Out (Admin)</button>
                    <button onclick="viewFormSubmissions('${doc.id}', '${form.title}')">View Submissions</button>
                    <button onclick="shareForm('${doc.id}')">Share Public Link</button>
                    <button onclick="deleteFormDefinition('${doc.id}')">Delete Definition</button>
                </li>`;
        });
        formsList.innerHTML = html;
    } catch (error) {
        console.error("Error loading forms: ", error);
        formsList.innerHTML = '<li>Error loading forms.</li>';
    }
}

function shareForm(formId) {
    const publicFormUrl = `${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))}/public-form.html?formId=${formId}`;
    // You can enhance this to copy to clipboard or show in a modal
    prompt("Share this link for public form submission:", publicFormUrl);
}

// Render the selected form for filling
async function renderFormForFilling(formId) {
    if (!currentUid) return;

    try {
        const formDoc = await formsCollection.doc(formId).get();
        if (!formDoc.exists) {
            alert("Form not found!");
            return;
        }

        const formData = formDoc.data();
        fillFormTitle.textContent = `Filling Out: ${formData.title}`;
        dynamicForm.innerHTML = ''; // Clear previous form

        formData.fields.forEach(field => {
            const fieldWrapper = document.createElement('div');
            fieldWrapper.classList.add('form-group');

            const label = document.createElement('label');
            label.setAttribute('for', field.name);
            label.textContent = field.label;
            fieldWrapper.appendChild(label);

            let inputElement;
            if (field.type === 'textarea') {
                inputElement = document.createElement('textarea');
            } else {
                inputElement = document.createElement('input');
                inputElement.type = field.type;
            }

            inputElement.id = field.name;
            inputElement.name = field.name;
            if (field.placeholder) inputElement.placeholder = field.placeholder;
            // Add 'required' if it was part of the definition (optional, not implemented in create form yet)
            // if (field.required) inputElement.required = true;

            fieldWrapper.appendChild(inputElement);
            dynamicForm.appendChild(fieldWrapper);
        });

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Submit Form';
        dynamicForm.appendChild(submitButton);

        // Attach event listener for this specific form submission
        dynamicForm.onsubmit = async (e) => {
            e.preventDefault();
            const submissionData = {
                formId: formId,
                formTitle: formData.title,
                userId: currentUid,
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                data: {}
            };

            formData.fields.forEach(field => {
                const inputElement = document.getElementById(field.name);
                submissionData.data[field.name] = (inputElement.type === 'checkbox') ? inputElement.checked : inputElement.value;
            });

            try {
                await formSubmissionsCollection.add(submissionData);
                alert('Form submitted successfully!');
                dynamicForm.reset();
                // Optionally, navigate back or clear view
                fillFormView.style.display = 'none';
                createFormView.style.display = 'block';
                listFormsView.style.display = 'block';
            } catch (error) {
                console.error("Error submitting form: ", error);
                alert("Error submitting form: " + error.message);
            }
        };

        createFormView.style.display = 'none';
        listFormsView.style.display = 'none';
        fillFormView.style.display = 'block';

    } catch (error) {
        console.error("Error rendering form: ", error);
        alert("Error loading form for filling.");
    }
}

async function deleteFormDefinition(formId) {
    if (!currentUid) return;
    if (confirm("Are you sure you want to delete this form definition? This will NOT delete any submitted data for this form.")) {
        try {
            await formsCollection.doc(formId).delete();
            loadForms(); // Refresh the list
        } catch (error) {
            console.error("Error deleting form definition: ", error);
            alert("Error deleting form definition: " + error.message);
        }
    }
}

backToFormsListBtn.addEventListener('click', () => {
    fillFormView.style.display = 'none';
    createFormView.style.display = 'block';
    listFormsView.style.display = 'block';
});

// --- View Submissions ---

async function viewFormSubmissions(formId, formTitle) {
    if (!currentUid) return;

    submissionsViewTitle.textContent = `Submissions for: ${formTitle}`;
    submissionsList.innerHTML = 'Loading submissions...';
    submissionDetailView.style.display = 'none'; // Hide detail view initially

    try {
        const snapshot = await formSubmissionsCollection
            .where("formId", "==", formId)
            .orderBy("submittedAt", "desc")
            .get();

        if (snapshot.empty) {
            submissionsList.innerHTML = '<li>No submissions found for this form.</li>';
        } else {
            let html = '';
            snapshot.forEach(doc => {
                const submission = doc.data();
                const submissionDate = submission.submittedAt ? new Date(submission.submittedAt.seconds * 1000).toLocaleString() : 'N/A';
                // Attempt to find a 'name' or 'email' field for a quick summary, otherwise use date.
                let summary = `Submitted: ${submissionDate}`;
                if (submission.data) {
                    const nameField = Object.keys(submission.data).find(key => key.toLowerCase().includes('name'));
                    const emailField = Object.keys(submission.data).find(key => key.toLowerCase().includes('email'));
                    if (nameField && submission.data[nameField]) {
                        summary = `${submission.data[nameField]} - ${submissionDate}`;
                    } else if (emailField && submission.data[emailField]) {
                        summary = `${submission.data[emailField]} - ${submissionDate}`;
                    }
                }
                html += `<li data-submission-id="${doc.id}">
                            <span>${summary}</span>
                            <div><button onclick="viewSubmissionDetail('${doc.id}')">View Details</button> <button class="delete-submission-btn" onclick="deleteSubmission('${doc.id}', '${formId}', '${formTitle}')">Delete</button></div>
                         </li>`;
            });
            submissionsList.innerHTML = html;
        }
    } catch (error) {
        console.error("Error loading submissions: ", error);
        submissionsList.innerHTML = '<li>Error loading submissions.</li>';
    }

    createFormView.style.display = 'none';
    listFormsView.style.display = 'none';
    fillFormView.style.display = 'none';
    viewSubmissionsView.style.display = 'block';
    submissionsList.style.display = 'block'; // Ensure list is visible
}

async function viewSubmissionDetail(submissionId) {
    const submissionDoc = await formSubmissionsCollection.doc(submissionId).get();
    submissionDetailContent.innerHTML = ''; // Clear previous details

    if (submissionDoc.exists) {
        const submissionData = submissionDoc.data();
        const detailsHtml = document.createElement('dl'); // Using a definition list for key-value pairs

        // Add Form Title and Submitted At to the details
        const dtTitle = document.createElement('dt');
        dtTitle.textContent = 'Form Title';
        const ddTitle = document.createElement('dd');
        ddTitle.textContent = submissionData.formTitle || 'N/A';
        detailsHtml.appendChild(dtTitle);
        detailsHtml.appendChild(ddTitle);

        const dtSubmitted = document.createElement('dt');
        dtSubmitted.textContent = 'Submitted At';
        const ddSubmitted = document.createElement('dd');
        ddSubmitted.textContent = submissionData.submittedAt ? new Date(submissionData.submittedAt.seconds * 1000).toLocaleString() : 'N/A';
        detailsHtml.appendChild(dtSubmitted);
        detailsHtml.appendChild(ddSubmitted);

        for (const key in submissionData.data) {
            const dt = document.createElement('dt');
            dt.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Prettify key
            const dd = document.createElement('dd');
            dd.textContent = submissionData.data[key];
            detailsHtml.appendChild(dt);
            detailsHtml.appendChild(dd);
        }
        submissionDetailContent.appendChild(detailsHtml);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete This Submission';
        deleteButton.onclick = () => deleteSubmission(submissionId, submissionData.formId, submissionData.formTitle);
        deleteButton.style.marginTop = '10px';
        deleteButton.style.backgroundColor = '#d9534f'; // Red color for delete
        submissionDetailContent.appendChild(deleteButton);

        submissionsList.style.display = 'none'; // Hide the list of submissions
        submissionDetailView.style.display = 'block'; // Show the detail view
    } else {
        alert("Submission not found.");
    }
}

backToSubmissionsListBtn.addEventListener('click', () => {
    submissionDetailView.style.display = 'none';
    submissionsList.style.display = 'block';
});

backToFormsListFromSubmissionsBtn.addEventListener('click', () => {
    viewSubmissionsView.style.display = 'none';
    listFormsView.style.display = 'block'; // Or createFormView depending on desired flow
});

async function deleteSubmission(submissionId, formIdToReload, formTitleToReload) {
    if (!currentUid) return;

    if (confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
        try {
            await formSubmissionsCollection.doc(submissionId).delete();
            alert("Submission deleted successfully.");
            // Refresh the submissions list for the current form
            submissionDetailView.style.display = 'none'; // Hide detail view if it was open
            submissionsList.style.display = 'block'; // Ensure list is visible
            viewFormSubmissions(formIdToReload, formTitleToReload); // Reload the submissions for the same form
        } catch (error) {
            console.error("Error deleting submission: ", error);
            alert("Error deleting submission: " + error.message);
        }
    }
}
