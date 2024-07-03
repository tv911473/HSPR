import { populateSeasonsDropdown } from "../suggestions.js";

async function displayLeaderboard(season, sugu, vanusegrupp, name) {
    const queryParams = new URLSearchParams({
        season: season || '',
        sugu: sugu || '',
        vanusegrupp: vanusegrupp || '',
        name: name || ''
    });

    try {
        const response = await fetch(`/hspr/api/leaderboard?${queryParams.toString()}`, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
        });

        if (!response.ok) {
            throw new Error('Edetabeli andmete kättesaamine ebaõnnestus');
        }

        const { season: chosenSeason, data: leaderboardData } = await response.json();
        renderLeaderboard(chosenSeason, leaderboardData);
    } catch (error) {
        console.error('Viga: ', error);
        alert('Ei saa kuvada edetabelit');
    }
}

// Function to render the leaderboard in the HTML
function renderLeaderboard(chosenSeason, data) {
    const leaderboardTableBody = document.getElementById('leaderboardTableBody');
    leaderboardTableBody.innerHTML = '';

    const chosenSeasonElement = document.getElementById('chosenSeason');
    chosenSeasonElement.textContent = `Hooaeg: ${chosenSeason}`;

    const leaderboardTableHead = document.querySelector('.leaderboard-table thead');
    const noDataMessage = '<tr><td colspan="6">Andmed puuduvad</td></tr>';

    if (data.length === 0) {
        leaderboardTableBody.innerHTML = noDataMessage;
        leaderboardTableHead.style.display = 'none';
    } else {
        leaderboardTableHead.style.display = '';
        let x = 1;
        data.forEach(row => {

            const tr = document.createElement('tr');
            tr.dataset.athleteId = row.sportlane_id;
            tr.dataset.vanusegrupp = row.vanusegrupp;
            tr.dataset.hooaeg = row.hooaeg;
            tr.dataset.eesnimi = row.eesnimi;
            tr.dataset.perenimi = row.perenimi;

            tr.innerHTML = `
                <td>${x++}</td>
                <td>${row.eesnimi}</td>
                <td>${row.perenimi}</td>
                <td>${row.sugu}</td>
                <td>${row.vanusegrupp}</td>
                <td>${row.punktid_sum}</td>
            `;

            leaderboardTableBody.appendChild(tr);
        });

        // Attach click event listeners for each row
        document.querySelectorAll('.leaderboard-table tbody tr').forEach(row => {
            row.addEventListener('click', async function() {
                const athleteId = this.dataset.athleteId;
                const vanusegrupp = this.dataset.vanusegrupp;
                const hooaeg = this.dataset.hooaeg;
                const eesnimi = this.dataset.eesnimi;
                const perenimi = this.dataset.perenimi;

                if (!athleteId) {
                    console.error('Athlete ID is undefined');
                    return;
                }

                await fetchAndDisplayPointsDetails(athleteId, vanusegrupp, hooaeg, eesnimi, perenimi);
            });
        });
    }
}

// Function to fetch and display points details in the modal
async function fetchAndDisplayPointsDetails(athleteId, vanusegrupp, hooaeg, eesnimi, perenimi) {
    try {
        const response = await fetch(`/hspr/api/leaderboard/points-details/${athleteId}?vanusegrupp=${vanusegrupp}&hooaeg=${hooaeg}`);
        if (!response.ok) {
            throw new Error('Failed to fetch points details');
        }
        const data = await response.json();
        displayPointsDetails(data, `${eesnimi} ${perenimi}`);
    } catch (error) {
        console.error('Error fetching points details:', error);
        alert('Viga punktide detailide kättesaamisel. Palun kontrollige vanusegruppi ja proovige uuesti.');
    }
}

// Function to display points details in a modal
function displayPointsDetails(pointsData, athleteName) {
    const modal = document.getElementById('athleteDetailsModal');
    const pointsDetailsBody = document.getElementById('pointsDetailsBody');
    const athleteNameElement = document.getElementById('athleteName');

    pointsDetailsBody.innerHTML = '';

    athleteNameElement.textContent = `Sportlane: ${athleteName}`;

    pointsData.detailedPoints.forEach(detail => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${detail.event}</td>
            <td>${detail.points}</td>
            <td>${detail.meters}</td>
        `;
        pointsDetailsBody.appendChild(row);
    });

    modal.style.display = 'block';

    document.querySelector('.close').onclick = function() {
        modal.style.display = 'none';
    };

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Event listener for the filter form submission
document.getElementById('leaderboardFilterForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const season = document.getElementById('seasonInput').value || '';
    const sugu = document.getElementById('sugu').value || '';
    const vanusegrupp = document.getElementById('vanusegrupp').value || '';
    const name = document.getElementById('name').value || '';
    await displayLeaderboard(season, sugu, vanusegrupp, name);
});

window.addEventListener('load', async () => {
    await populateSeasonsDropdown();
    await displayLeaderboard();
});

document.getElementById('logoutButton')?.addEventListener('click', () => {
    window.location.href = '/hspr/user/logout';
});