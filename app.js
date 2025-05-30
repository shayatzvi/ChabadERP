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
const loggedInUserDiv = document.getElementById('loggedInUserDiv');

const contactsModule = document.getElementById('contacts-module'); // Renamed
const contactForm = document.getElementById('contactForm');
const contactIdInput = document.getElementById('contactId'); // from contacts
const nameInput = document.getElementById('name'); // from contacts
const emailInput = document.getElementById('email'); // from contacts
const phoneInput = document.getElementById('phone'); // from contacts
const contactList = document.getElementById('contactList'); // from contacts
const formsModule = document.getElementById('forms-module'); // Renamed
const formDefinitionForm = document.getElementById('formDefinitionForm');
const formTitleInput = document.getElementById('formTitle');
const formFieldsContainer = document.getElementById('formFieldsContainer');
const editingFormIdInput = document.getElementById('editingFormId');
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
        loggedInUserDiv.style.display = 'block';

        // Show contacts module by default after login
        contactsModule.style.display = 'block';
        formsModule.style.display = 'none';
        document.getElementById('navContactsLink').classList.add('active');
        document.getElementById('navFormsLink').classList.remove('active');

        loadContacts();
        // loadForms() is called when navigating to forms section
    } else {
        currentUid = null;
        userDetails.textContent = 'Not logged in.';
        loginBtn.style.display = 'block';
        loggedInUserDiv.style.display = 'none';

        contactsModule.style.display = 'none';
        formsModule.style.display = 'none';
        viewSubmissionsView.style.display = 'none';
        contactList.innerHTML = ''; // Clear contacts if logged out
        formsList.innerHTML = ''; // Clear forms if logged out
    }
});

// Navigation - update active states and module visibility
document.getElementById('navContacts').addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentUid) return;
    contactsModule.style.display = 'block';
    formsModule.style.display = 'none';
    document.getElementById('navContactsLink').classList.add('active');
    document.getElementById('navFormsLink').classList.remove('active');
});

document.getElementById('navForms').addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentUid) return;
    contactsModule.style.display = 'none';
    formsModule.style.display = 'block';
    createFormView.style.display = 'block'; // Show create form view by default
    listFormsView.style.display = 'block'; // Show list of forms
    fillFormView.style.display = 'none'; // Hide fill form view
    viewSubmissionsView.style.display = 'none';
    loadForms();
    document.getElementById('navFormsLink').classList.add('active');
    document.getElementById('navContactsLink').classList.remove('active');
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
        ownerAdminUid: currentUid, // This admin owns/created this contact
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
        // Load contacts where the ownerAdminUid matches the current logged-in admin
        const snapshot = await contactsCollection
            .where("ownerAdminUid", "==", currentUid)
            .orderBy("createdAt", "desc").get();
        if (snapshot.empty) {
            contactList.innerHTML = '<li>No contacts found.</li>';
            return;
        }
        let html = '';
        snapshot.forEach(doc => {
            const contact = doc.data();
            html += `
                <li class="list-group-item" data-id="${doc.id}">
                    <span>${contact.name} - ${contact.email || ''} - ${contact.phone || ''}</span>
                    <div class="btn-group pull-right" role="group">
                        <button class="btn btn-xs btn-warning" onclick="editContact('${doc.id}', '${contact.name}', '${contact.email || ''}', '${contact.phone || ''}')">Edit</button>
                        <button class="btn btn-xs btn-danger" onclick="deleteContact('${doc.id}')">Delete</button>
                    </div>
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
    if (!currentUid) {
        alert("Please log in to get a shareable link.");
        return;
    }
    const publicContactFormUrl = `${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))}/public-contact-form.html?adminUid=${currentUid}`;
    prompt("Share this link for public contact submission:", publicContactFormUrl);
});


// --- Forms Management ---

let fieldCounter = 0; // Counter for unique field IDs in form definition

addFormFieldBtn.addEventListener('click', () => {
    fieldCounter++;
    const fieldDiv = document.createElement('div');
    // Use Bootstrap 'well' for better visual grouping of each field definition
    fieldDiv.classList.add('form-field-definition', 'well', 'well-sm'); 
    fieldDiv.innerHTML = `
        <div class="form-group">
            <label for="fieldLabel${fieldCounter}">Field Label:</label>
            <input type="text" class="form-control input-sm" id="fieldLabel${fieldCounter}" name="fieldLabel" placeholder="E.g., Full Name, Agree to Terms" required>
        </div>
        <div class="form-group">
            <label for="fieldType${fieldCounter}">Field Type:</label>
            <select class="form-control input-sm" id="fieldType${fieldCounter}" name="fieldType">
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="tel">Phone</option>
                <option value="date">Date</option>
                <option value="textarea">Text Area</option>
                <option value="checkbox">Checkbox</option>
                <option value="number">Number</option>
                <!-- Future: <option value="select">Dropdown (Select)</option> -->
                <!-- Future: <option value="radio">Radio Buttons</option> -->
            </select>
        </div>
        <!-- Placeholder for checkbox-specific options, like default checked state, if needed later -->
        <!-- <div class="form-group checkbox-options" style="display:none;">
            <label><input type="checkbox" name="defaultChecked${fieldCounter}"> Default to checked?</label>
        </div> -->
        <button type="button" class="btn btn-danger btn-xs" onclick="this.parentElement.remove()">Remove Field</button>
    `;
    formFieldsContainer.appendChild(fieldDiv);
});

// Handle both creating new forms and updating existing ones
formDefinitionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUid) {
        alert("Please log in to create forms.");
        return;
    }

    const formIdToEdit = editingFormIdInput.value;
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
        if (formIdToEdit) {
            // Update existing form
            await formsCollection.doc(formIdToEdit).update(formDefinition);
            alert("Form definition updated!");
        } else {
            // Add new form
            await formsCollection.add(formDefinition);
            alert("Form definition saved!");
        }
        formDefinitionForm.reset();
        editingFormIdInput.value = ''; // Clear editing ID
        formFieldsContainer.innerHTML = '';
        fieldCounter = 0;
        loadForms();
        document.getElementById('saveFormDefinitionBtn').textContent = 'Save Form Definition'; // Reset button text
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
                <li class="list-group-item" data-id="${doc.id}">
                    <span>${form.title}</span>
                    <div class="btn-group pull-right">
                        <button class="btn btn-xs btn-warning" onclick="prepareEditFormDefinition('${doc.id}')">Edit</button>
                        <button class="btn btn-xs btn-info" onclick="renderFormForFilling('${doc.id}')">Fill Out</button>
                        <button class="btn btn-xs btn-primary" onclick="viewFormSubmissions('${doc.id}', '${form.title}')">View Submissions</button>
                        <button class="btn btn-xs btn-default" onclick="shareForm('${doc.id}')">Share Link</button>
                        <button class="btn btn-xs btn-danger" onclick="deleteFormDefinition('${doc.id}')">Delete Def.</button>
                    </div>
                </li>`;
        });
        formsList.innerHTML = html;
    } catch (error) {
        console.error("Error loading forms: ", error);
        formsList.innerHTML = '<li>Error loading forms.</li>';
    }
}

async function prepareEditFormDefinition(formId) {
    if (!currentUid) return;

    try {
        const formDoc = await formsCollection.doc(formId).get();
        if (!formDoc.exists) {
            alert("Form definition not found for editing.");
            return;
        }
        const formData = formDoc.data();

        // Populate the form definition form
        editingFormIdInput.value = formId;
        formTitleInput.value = formData.title;

        formFieldsContainer.innerHTML = ''; // Clear existing fields
        fieldCounter = 0; // Reset counter for new fields if any are added

        formData.fields.forEach(field => {
            fieldCounter++; // Increment for unique IDs, though these are pre-existing
            const fieldDiv = document.createElement('div');
            fieldDiv.classList.add('form-field-definition');
            // Note: The IDs for label and select might not perfectly match fieldCounter if fields were reordered/deleted in DB,
            // but for populating the form, this structure is fine. The 'name' attribute is what matters for submission.
            fieldDiv.innerHTML = `
                <div>
                    <label for="fieldLabel${fieldCounter}">Field Label:</label>
                    <input type="text" id="fieldLabel${fieldCounter}" name="fieldLabel" value="${field.label}" placeholder="E.g., Full Name" required>
                </div>
                <div>
                    <label for="fieldType${fieldCounter}">Field Type:</label>
                    <select id="fieldType${fieldCounter}" name="fieldType">
                        <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                        <option value="email" ${field.type === 'email' ? 'selected' : ''}>Email</option>
                        <option value="tel" ${field.type === 'tel' ? 'selected' : ''}>Phone</option>
                        <option value="date" ${field.type === 'date' ? 'selected' : ''}>Date</option>
                        <option value="textarea" ${field.type === 'textarea' ? 'selected' : ''}>Text Area</option>
                        <option value="checkbox" ${field.type === 'checkbox' ? 'selected' : ''}>Checkbox</option>
                        <option value="number" ${field.type === 'number' ? 'selected' : ''}>Number</option>
                    </select> <small class="text-muted">(Type of input field)</small>
                </div>
                <button type="button" class="btn btn-xs btn-danger" onclick="this.parentElement.remove()">Remove Field</button>
                <hr>
            `;
            formFieldsContainer.appendChild(fieldDiv);
        });

        document.getElementById('saveFormDefinitionBtn').textContent = 'Update Form Definition';
        // Scroll to the top to see the populated form
        window.scrollTo(0, document.getElementById('create-form-view').offsetTop);

    } catch (error) {
        console.error("Error preparing form for editing: ", error);
        alert("Could not load form definition for editing.");
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
            fieldWrapper.classList.add('form-group'); // Bootstrap class

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
            inputElement.classList.add('form-control'); // Bootstrap class
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
        submitButton.classList.add('btn', 'btn-primary'); // Bootstrap class
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
                html += `<li class="list-group-item" data-submission-id="${doc.id}">
                            <span>${summary}</span>
                            <div class="btn-group pull-right">
                                <button class="btn btn-xs btn-info" onclick="viewSubmissionDetail('${doc.id}')">View Details</button> 
                                <button class="btn btn-xs btn-danger delete-submission-btn" onclick="deleteSubmission('${doc.id}', '${formId}', '${formTitle}')">Delete</button></div>
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
        deleteButton.classList.add('btn', 'btn-danger', 'btn-sm');
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
