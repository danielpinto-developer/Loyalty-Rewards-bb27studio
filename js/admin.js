import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4eMq0Y8ERerdBIzsySqtG9QnisI3CBIc",
  authDomain: "bb27studio-loyalty-program.firebaseapp.com",
  projectId: "bb27studio-loyalty-program",
  storageBucket: "bb27studio-loyalty-program.appspot.com",
  messagingSenderId: "827670961717",
  appId: "1:827670961717:web:9e7b9d33ddd047dfcc9b7c",
  measurementId: "G-Y30PX1R10P",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const serviceTranslation = {
  Eyelashes: "Pestañas",
  Nails: "Uñas",
  Pedicure: "Pedicure",
  Retouches: "Retoques",
};

document.getElementById("buscarButton").addEventListener("click", async () => {
  const phoneNumber = document.getElementById("phone-number").value;
  const messageElement = document.getElementById("message");
  const clientInfoContainer = document.getElementById("client-info");
  const numeroContainer = document.querySelector(".numero");
  const registerButton = document.getElementById("registerButton");

  if (!phoneNumber) {
    alert("Por favor, introduzca un número de teléfono");
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", phoneNumber));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      messageElement.style.display = "none";
      clientInfoContainer.style.display = "block";
      numeroContainer.style.display = "none";
      registerButton.style.display = "none";
      window.history.pushState(
        {},
        "",
        `/client?phone=${phoneNumber}&name=${encodeURIComponent(userData.Name)}`
      );
      displayClientInfo(phoneNumber, userData.Name);
    } else {
      messageElement.style.display = "block";
      messageElement.textContent = "Cuenta no encontrada";
    }
  } catch (e) {
    console.error("Error fetching document: ", e);
    messageElement.style.display = "block";
    messageElement.textContent = "Error checking account";
  }
});

document.getElementById("registerButton").addEventListener("click", () => {
  const numeroContainer = document.querySelector(".numero");
  const registerButton = document.getElementById("registerButton");
  const modal = document.getElementById("modal");

  numeroContainer.style.display = "none";
  registerButton.style.display = "none";
  modal.style.display = "block";
});

document.getElementById("addButton").addEventListener("click", async () => {
  const name = document.getElementById("new-name").value;
  const phoneNumber = document.getElementById("new-phone-number").value;
  const bday = document.getElementById("new-birthday").value;

  if (!name || !phoneNumber || !bday) {
    alert(
      "Por favor ingrese un nombre, número de teléfono y fecha de cumpleaños"
    );
    return;
  }

  try {
    await setDoc(doc(db, "users", phoneNumber), {
      Name: name,
      Birthday: bday,
      services: [],
    });
    alert("Nuevo número agregado exitosamente!");
    location.reload();
  } catch (error) {
    console.error("Error al agregar un nuevo número:", error);
    alert("Error al agregar un nuevo número.");
  }
});

async function displayClientInfo(phoneNumber, clientName) {
  try {
    const userDoc = await getDoc(doc(db, "users", phoneNumber));
    const clientInfoDiv = document.getElementById("previous-section");
    const clientDetails = document.getElementById("client-details");
    const header = document.getElementById("header");

    header.textContent = "Info de Cuenta";

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const bday = userData.Birthday || "No especificado";
      clientDetails.innerHTML = `${clientName} - ${phoneNumber} - ${bday}`;
      clientInfoDiv.innerHTML = "";

      if (userData.services && userData.services.length > 0) {
        userData.services.forEach((entry) => {
          const translatedService =
            serviceTranslation[entry.type] || entry.type;
          clientInfoDiv.innerHTML += `<p>${entry.date} - ${translatedService}</p>`;
        });
      } else {
        clientInfoDiv.innerHTML = "<p>No se encontraron registros.</p>";
      }
    } else {
      clientInfoDiv.innerHTML = "<p>No se encontraron registros.</p>";
    }
  } catch (error) {
    console.error("Error al mostrar la información del cliente:", error);
    clientInfoDiv.innerHTML = "<p>Error al recuperar registros.</p>";
  }
}

document.getElementById("showPreviousButton").addEventListener("click", () => {
  document.getElementById("previous-section").style.display = "block";
  document.getElementById("add-points-section").style.display = "none";
  document.getElementById("discounts-section").style.display = "none";
});

document.getElementById("showAddPointsButton").addEventListener("click", () => {
  document.getElementById("previous-section").style.display = "none";
  document.getElementById("add-points-section").style.display = "block";
  document.getElementById("discounts-section").style.display = "none";
});

document.getElementById("showDiscountsButton").addEventListener("click", () => {
  document.getElementById("previous-section").style.display = "none";
  document.getElementById("add-points-section").style.display = "none";
  document.getElementById("discounts-section").style.display = "block";
  displayDiscounts();
});

document
  .getElementById("addServiceButton")
  .addEventListener("click", async () => {
    const service = document.getElementById("service").value;
    const phoneNumber = new URLSearchParams(window.location.search).get(
      "phone"
    );
    const date = new Date().toLocaleDateString("en-GB");

    try {
      const userRef = doc(db, "users", phoneNumber);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedServices = [
          ...(userData.services || []),
          { date, type: service },
        ];
        await updateDoc(userRef, { services: updatedServices });
        displayClientInfo(phoneNumber, userData.Name);
        alert("Servicio agregado exitosamente!");
        showTab("previous-section");
      }
    } catch (error) {
      console.error("Error updating Firestore:", error);
      alert("Error al agregar el servicio.");
    }
  });

async function displayDiscounts() {
  const phoneNumber = new URLSearchParams(window.location.search).get("phone");
  const discountsDiv = document.getElementById("discounts-section");
  discountsDiv.innerHTML = "";

  try {
    const userDoc = await getDoc(doc(db, "users", phoneNumber));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const servicesGrouped = groupServices(userData.services);

      let hasDiscounts = false;

      for (const [type, count] of Object.entries(servicesGrouped)) {
        if (count >= 5) {
          hasDiscounts = true;
          const translatedType = serviceTranslation[type] || type;

          const serviceContainer = document.createElement("div");
          serviceContainer.className = "service-container";

          const p = document.createElement("p");
          p.textContent = translatedType;

          const button = document.createElement("button");
          button.textContent = "Activar";
          button.classList.add("green-button");
          button.addEventListener("click", () => redeemDiscount(type));

          serviceContainer.appendChild(button);
          serviceContainer.appendChild(p);
          discountsDiv.appendChild(serviceContainer);
        }
      }

      if (!hasDiscounts) {
        discountsDiv.innerHTML =
          "<p>No hay descuentos disponibles por el momento.</p>";
      }
    } else {
      discountsDiv.innerHTML =
        "<p>No hay descuentos disponibles por el momento.</p>";
    }
  } catch (error) {
    console.error("Error displaying discounts:", error);
    discountsDiv.innerHTML = "<p>Error al obtener descuentos.</p>";
  }
}

async function redeemDiscount(type) {
  console.log("Redeem button clicked for:", type);
  const phoneNumber = new URLSearchParams(window.location.search).get("phone");
  const userDocRef = doc(db, "users", phoneNumber);

  try {
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      console.log("User document found:", userDoc.data());
      const userData = userDoc.data();
      const updatedServices = userData.services.map((service) => {
        if (service.type === type && !service.redeemed) {
          console.log("Redeeming service:", service);
          return { ...service, redeemed: true };
        }
        return service;
      });

      await updateDoc(userDocRef, { services: updatedServices });
      console.log("Updated services:", updatedServices);
      displayDiscounts();
      alert(
        `${serviceTranslation[type] || type} descuento activado exitosamente!`
      );

      localStorage.setItem("redeemed", "true");
    } else {
      console.error("Error redeeming discount: user document not found.");
      alert("Error al activar el descuento.");
    }
  } catch (error) {
    console.error("Error redeeming discount:", error);
    alert("Error al activar el descuento.");
  }
}

function groupServices(services) {
  return services.reduce((acc, service) => {
    if (!service.redeemed) {
      acc[service.type] = (acc[service.type] || 0) + 1;
    }
    return acc;
  }, {});
}

function showTab(tabId) {
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => {
    tab.style.display = "none";
  });
  document.getElementById(tabId).style.display = "block";
}
