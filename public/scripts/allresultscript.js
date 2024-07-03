import { validateName, capitalizeName, checkInput} from "../validation.js";
import { addInputEventListeners, populateSeasonsDropdown } from "../suggestions.js";

function editResult(id, eesnimi, perenimi, meetrid, sugu, ala) {
    document.getElementById('editId').value = id;
    document.getElementById('editEesnimi').value = eesnimi;
    document.getElementById('editPerenimi').value = perenimi;
    document.getElementById('editMeetrid').value = meetrid;
    document.getElementById('editSugu').value = sugu;
    document.getElementById('editAla').value = ala;
    document.getElementById('editModal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

let validationError = false;
document.getElementById('editForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const id = document.getElementById('editId').value;
    const eesnimi = capitalizeName(document.getElementById('editEesnimi').value);
    const perenimi = capitalizeName(document.getElementById('editPerenimi').value);
    const meetrid = document.getElementById('editMeetrid').value;
    const sugu = document.getElementById('editSugu').value;
    const ala = document.getElementById('editAla').value;

    if (!eesnimi || !perenimi || !meetrid || !sugu || !ala) {
        alert('Kõik väljad on vajalikud!');
        return;
    }
    if (!validateName(eesnimi) || !validateName(perenimi)) {
        alert('Nimi sisaldab keelatud tähemärke!');
        validationError = true;
        return;
    }
    if (!checkInput(meetrid)) {
        alert("Väärtuse vahemik 0.01 - 120!");
        validationError = true;
        return;
    }
    if (validationError) return;

    fetch(`/hspr/api/update-result/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eesnimi, perenimi, meetrid, sugu, ala })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(`Error: ${data.error}`);
        } else {
            alert('Tulemus edukalt muudetud!');
            window.location.reload();
        }
    })
    .catch(error => console.error('Error:', error));
});

function deleteResult(id) {
    if (confirm('Oled kindel, et tahad tulemust kustutada?')) {
        fetch(`/hspr/api/delete-result/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(`Error: ${data.error}`);
            } else {
                alert('Tulemus kustutatud edukalt!');
                window.location.reload();
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const firstNameInput = document.getElementById('eesnimi');
    const lastNameInput = document.getElementById('perenimi');
    const firstNameSuggestions = document.getElementById('eesnimi-soovitus');
    const lastNameSuggestions = document.getElementById('perenimi-soovitus');

    addInputEventListeners(firstNameInput, firstNameSuggestions, '/hspr/api/athlete/firstNames', firstNameInput, lastNameInput);
    addInputEventListeners(lastNameInput, lastNameSuggestions, '/hspr/api/athlete/lastNames', firstNameInput, lastNameInput);

    document.addEventListener('click', (event) => {
        if (!document.getElementById('editModal').contains(event.target)) {
            document.querySelectorAll('.suggestions').forEach(suggestionsList => {
                suggestionsList.style.display = 'none';
            });
        }
    });

    document.getElementById('logoutButton')?.addEventListener('click', () => {
        window.location.href = '/hspr/api/user/logout';
    });

    window.editResult = editResult;
    window.closeEditModal = closeEditModal;
    window.deleteResult = deleteResult;
});

window.addEventListener('load', async () => {
    await populateSeasonsDropdown();
});