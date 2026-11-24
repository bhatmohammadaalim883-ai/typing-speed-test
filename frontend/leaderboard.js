
const API_URL = "https://typing-speed-test-26ct.onrender.com";

const periodSelect = document.getElementById("period");
const refreshBtn = document.getElementById("refreshBtn");
const leaderboardMessage = document.getElementById("leaderboardMessage");
const leaderboardTable = document.getElementById("leaderboardTable");
const leaderboardBody = document.getElementById("leaderboardBody");
const myRankText = document.getElementById("myRankText");

let currentUsername = null;

async function loadMyProfile() {
  const token = sessionStorage.getItem("typemaster_token");

  if (!token) {
    myRankText.textContent = "Log in to see your ranking.";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      myRankText.textContent = "Your login session may have expired. Please log in again.";
      return;
    }

    const data = await response.json();
    currentUsername = data.user?.username || null;
  } catch (error) {
    console.error("Profile error:", error);
  }
}

async function loadLeaderboard() {
  leaderboardMessage.textContent = "Loading leaderboard...";
  leaderboardTable.hidden = true;
  leaderboardBody.replaceChildren();

  const period = periodSelect.value;

  try {
    const response = await fetch(
      `${API_URL}/api/leaderboard?period=${encodeURIComponent(period)}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Could not load leaderboard.");
    }

    const users = data.leaderboard;

    if (!Array.isArray(users) || users.length === 0) {
      leaderboardMessage.textContent =
        "No typing test results are available for this period yet.";
      myRankText.textContent = "No ranking available yet.";
      return;
    }

    leaderboardMessage.textContent = "";
    leaderboardTable.hidden = false;

    users.forEach((user, index) => {
      const row = document.createElement("tr");

      const rank = document.createElement("td");
      rank.className = "rank";
      rank.textContent = `#${index + 1}`;

      const username = document.createElement("td");
      username.className = "username";
      username.textContent = user.username;

      const tests = document.createElement("td");
      tests.textContent = user.total_tests;

      const wpm = document.createElement("td");
      wpm.textContent = Number(user.average_wpm).toFixed(1);

      const accuracy = document.createElement("td");
      accuracy.textContent =
        Number(user.average_accuracy).toFixed(1) + "%";

      row.append(rank, username, tests, wpm, accuracy);
      leaderboardBody.appendChild(row);
    });

    updateMyRanking(users);

  } catch (error) {
    console.error("Leaderboard error:", error);
    leaderboardMessage.textContent =
      "Unable to load rankings. Please try again later.";
  }
}

function updateMyRanking(users) {
  if (!currentUsername) {
    myRankText.textContent = "Log in to see your ranking.";
    return;
  }

  const index = users.findIndex(
    user => user.username === currentUsername
  );

  if (index === -1) {
    myRankText.textContent =
      "You have no ranking in this period yet. Complete a typing test to qualify.";
    return;
  }

  const user = users[index];

  myRankText.textContent =
    `Your rank: #${index + 1} | Average speed: ` +
    `${Number(user.average_wpm).toFixed(1)} WPM`;
}

async function initializeLeaderboard() {
  await loadMyProfile();
  await loadLeaderboard();
}

periodSelect.addEventListener("change", loadLeaderboard);
refreshBtn.addEventListener("click", initializeLeaderboard);

initializeLeaderboard();
