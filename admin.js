import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC4eMq0Y8ERerdBIzsySqtG9QnisI3CBIc",
    authDomain: "bb27studio-loyalty-program.firebaseapp.com",
    projectId: "bb27studio-loyalty-program",
    storageBucket: "bb27studio-loyalty-program.appspot.com",
    messagingSenderId: "827670961717",
    appId: "1:827670961717:web:9e7b9d33ddd047dfcc9b7c",
    measurementId: "G-Y30PX1R10P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.getElementById('checkPhoneNumberButton').addEventListener('click', async () => {
    const phoneNumber = document.getElementById('phone-number').value;
    const messageElement = document.getElementById('message');
    const numeroContainer = document.getElementById('numeroContainer');
    const clientInfoContainer = document.getElementById('client-info');

    if (!phoneNumber) {
        alert('Please enter a phone number');
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "users", phoneNumber));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            // Redirect to the new URL with parameters
            window.location.href = `/admin.html?phone=${phoneNumber}&name=${encodeURIComponent(userData.Name)}`;
        } else {
            messageElement.style.display = 'block'; // Show message if account not found
            messageElement.textContent = 'Cuenta no encontrada';
            clientInfoContainer.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking phone number:', error);
        messageElement.style.display = 'block';
        messageElement.textContent = 'Error checking account';
        clientInfoContainer.style.display = 'none';
    }
});

function showTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.style.display = 'none';
    });
    document.getElementById(tabId).style.display = 'block';
}

async function displayClientInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const phoneNumber = urlParams.get('phone');
    const name = urlParams.get('name');
    const clientInfoDiv = document.getElementById('basic-info');

    clientInfoDiv.innerHTML = `<p>Phone: ${phoneNumber}</p><p>Name: ${name}</p>`;

    try {
        const userDoc = await getDoc(doc(db, "users", phoneNumber));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const serviceHistoryDiv = document.getElementById('service-history');
            serviceHistoryDiv.innerHTML = '';
            if (userData.services && userData.services.length > 0) {
                userData.services.forEach(service => {
                    serviceHistoryDiv.innerHTML += `<p>Date: ${service.date} - Service: ${service.type}</p>`;
                });
            } else {
                serviceHistoryDiv.innerHTML = '<p>No service records found.</p>';
            }
        } else {
            clientInfoDiv.innerHTML = '<p>No records found.</p>';
        }
    } catch (error) {
        console.error('Error displaying client info:', error);
        clientInfoDiv.innerHTML = '<p>Error fetching records.</p>';
    }
}

async function addService() {
    const service = document.getElementById('service').value;
    const urlParams = new URLSearchParams(window.location.search);
    const phoneNumber = urlParams.get('phone');
    const date = new Date().toLocaleDateString('en-GB'); // Get current date in dd/mm/yyyy format

    console.log('Adding service:', { phoneNumber, service, date });

    // Update the Firestore with the new service and current date
    await updateSheet(phoneNumber, service, date);

    // Refresh the service history
    await displayClientInfo();

    // Check discount eligibility and display the message
    checkDiscountEligibility(service);
}

async function updateSheet(phoneNumber, service, date) {
    const docRef = doc(db, "users", phoneNumber);
    
    try {
        await updateDoc(docRef, {
            services: arrayUnion({ date, type: service })
        });
        console.log('Firestore updated successfully');
    } catch (error) {
        console.error('Error updating Firestore:', error);
    }
}

function checkDiscountEligibility(service) {
    const phoneNumber = new URLSearchParams(window.location.search).get('phone');
    fetchSheetData().then(data => {
        const userEntries = data.filter(row => row.PhoneNumber == phoneNumber && row.ServiceType == service);

        const visitCount = userEntries.length;
        let discountMessage = '';

        if (service === 'Retouches' && visitCount >= 5) {
            discountMessage = `You have ${visitCount}/5 visits for ${service}. You have earned a 30% discount!`;
        } else if (visitCount >= 5) {
            discountMessage = `You have ${visitCount}/5 visits for ${service}. You have earned a 20% discount!`;
        } else {
            discountMessage = `You have ${visitCount}/5 visits for ${service}.`;
        }

        const discountElement = document.getElementById('discount-message');
        discountElement.style.display = 'block';
        discountElement.textContent = discountMessage;
        discountElement.style.color = visitCount >= 5 ? 'green' : 'black';
    });
}

window.onload = displayClientInfo;

document.getElementById('addServiceButton').addEventListener('click', addService);