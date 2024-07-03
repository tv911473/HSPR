import { validateName, capitalizeName, checkInput } from "../validation.js";
import { addInputEventListeners } from "../suggestions.js";

document.addEventListener('DOMContentLoaded', () => {
    const athleteForm = document.getElementById('resultsForm');
    const athleteEntryContainer = document.getElementById('athleteEntryContainer');
    const addAthleteButton = document.getElementById('addAthleteButton');

    function addAthleteEntryRow() {
        const newAthleteRow = document.getElementById('athleteRowTemplate').cloneNode(true);
        newAthleteRow.removeAttribute('id');
        newAthleteRow.classList.add('athlete-row', 'additional-athlete');

        newAthleteRow.querySelectorAll('input, select').forEach(input => {
            input.value = '';
            input.style.width = '137px';
        });
        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-athlete');
        removeButton.textContent = 'Eemalda';
        
        removeButton.addEventListener('click', () => {
            athleteEntryContainer.removeChild(newAthleteRow);
        });
        newAthleteRow.appendChild(removeButton);
        attachInputEventListeners(newAthleteRow);
        athleteEntryContainer.appendChild(newAthleteRow);
    }

    function attachInputEventListeners(row) {
        const firstNameInput = row.querySelector('.eesnimi-input');
        const firstNameSuggestions = row.querySelector('.eesnimi-suggestions');
        const lastNameInput = row.querySelector('.perenimi-input');
        const lastNameSuggestions = row.querySelector('.perenimi-suggestions');
        const genderSelect = row.querySelector('select[name="sugu"]');

        addInputEventListeners(firstNameInput, firstNameSuggestions, '/hspr/api/athlete/firstNames', firstNameInput, lastNameInput, genderSelect);
        addInputEventListeners(lastNameInput, lastNameSuggestions, '/hspr/api/athlete/lastNames', firstNameInput, lastNameInput, genderSelect);

        document.addEventListener('click', (event) => {
            if (!row.contains(event.target)) {
                firstNameSuggestions.style.display = 'none';
                lastNameSuggestions.style.display = 'none';
            }
        });
    }

    addAthleteButton.addEventListener('click', addAthleteEntryRow);

    const initialRow = document.querySelector('.athlete-row');
    attachInputEventListeners(initialRow);

    athleteForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const formData = new FormData(athleteForm);
        const vanusegrupp = formData.get('vanusegrupp');
        const ala = formData.get('ala');
        const athletes = [];
        let validationError = false;

        document.querySelectorAll('.athlete-row').forEach(row => {
            const eesnimiInput = row.querySelector('input[name="eesnimi"]');
            const perenimiInput = row.querySelector('input[name="perenimi"]');
            const eesnimi = capitalizeName(eesnimiInput.value);
            const perenimi = capitalizeName(perenimiInput.value);
            const sugu = row.querySelector('select[name="sugu"]').value;
            const meetrid = parseFloat(row.querySelector('input[name="meetrid"]').value);

            if (!validateName(eesnimi) || !validateName(perenimi)) {
                alert('Nimi sisaldab keelatud tähemärke!');
                validationError = true;
                return;
            }
            if (!checkInput(meetrid)) {
                alert("Väärtuse vahemik 0.01 - 120");
                validationError = true;
                return;
            }

            athletes.push({ eesnimi, perenimi, sugu, meetrid });
            eesnimiInput.value = eesnimi;
            perenimiInput.value = perenimi;
        });

        if (validationError) return;
        const data = { vanusegrupp, ala, athletes };
        try {
            const response = await fetch('/hspr/api/submit-result', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const contentType = response.headers.get('content-type');
            let result;

            if (contentType && contentType.indexOf('application/json') !== -1) {
                result = await response.json();
            } else {
                result = await response.text();
            }

            if (response.ok) {
                alert('Tulemused edukalt salvestatud!');
                athleteForm.reset();
                clearAdditionalAthleteRows();
            } else {
                alert(`Error: ${result.error || result}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred, please try again.');
        }
    });

    function clearAdditionalAthleteRows() {
        const additionalRows = document.querySelectorAll('.additional-athlete');
        additionalRows.forEach(row => athleteEntryContainer.removeChild(row));
    }
});
