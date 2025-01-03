console.log("content.js loaded!");

// Add Challenge and Join Buttons
function addChallengeButton() {
  const button = document.createElement("button");
  button.innerText = "Challenge a Friend";
  button.style.cssText =
    "position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #3498db; color: #fff; border: none; border-radius: 5px; cursor: pointer;";

  button.addEventListener("click", createChallenge);
  document.body.appendChild(button);
  console.log("Challenge button added!");

  const joinButton = document.createElement("button");
  joinButton.innerText = "Join Challenge";
  joinButton.style.cssText =
    "position: fixed; top: 50px; right: 10px; padding: 10px 20px; background: #e74c3c; color: #fff; border: none; border-radius: 5px; cursor: pointer;";

  joinButton.addEventListener("click", joinChallenge);
  document.body.appendChild(joinButton);
  console.log("Join button added!");

  const timerDiv = document.createElement("div");
  timerDiv.id = "countdown-timer";
  timerDiv.style.cssText =
    "position: fixed; top: 90px; right: 10px; padding: 10px; background: #2ecc71; color: #fff; border-radius: 5px; display: none; font-size: 16px;";
  document.body.appendChild(timerDiv);
  console.log("Countdown timer added!");

  restoreState();
}

// Generate Room ID
function generateRoomId(problemId, startTime, endTime, friendId, myId) {
  return `${problemId}_${startTime}_${endTime}_${friendId}_${myId}`;
}

// Convert hh:mm:ss format to milliseconds
function timeToMilliseconds(timeStr) {
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    console.error("Invalid time format:", timeStr);
    return NaN;
  }

  const now = new Date();
  now.setHours(hours, minutes, seconds, 0);
  return now.getTime();
}

// Create Challenge
function createChallenge() {
  const problemId = prompt("Enter the problem ID (e.g., 1234A):");
  const friendId = prompt("Enter your friend's Codeforces handle:");
  const myId = prompt("Enter your Codeforces handle:");
  const startTimeStr = prompt("Enter the challenge start time (hh:mm:ss):");
  const endTimeStr = prompt("Enter the challenge end time (hh:mm:ss):");

  const startTime = timeToMilliseconds(startTimeStr);
  const endTime = timeToMilliseconds(endTimeStr);

  if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
    alert("Invalid input! Please enter valid start and end times in hh:mm:ss format.");
    return;
  }

  const roomId = generateRoomId(problemId, startTime, endTime, friendId, myId);
  const challengeDetails = {
    roomId,
    problemId,
    friendId,
    myId,
    startTime,
    endTime,
  };

  localStorage.setItem("challengeDetails", JSON.stringify(challengeDetails));
  localStorage.setItem("activeChallenge", JSON.stringify(challengeDetails));
  alert(`Challenge created! Room ID: ${roomId}`);

  monitorContestStart(startTime, endTime, roomId);
  monitorFriendProgress(friendId, problemId, roomId); // Monitor friend's progress
  monitorFriendProgress(myId, problemId, roomId);    // Monitor host's progress
  monitorContestEnd(endTime, roomId);
  restoreState();
}

// Join Challenge
function joinChallenge() {
  const roomId = prompt("Enter the Room ID:");
  const roomIdPattern = /^\d+[A-Za-z]_\d{13}_\d{13}_[\w\d]+_[\w\d]+$/;

  if (!roomIdPattern.test(roomId)) {
    alert("Invalid Room ID format. Please enter a valid Room ID.");
    return;
  }

  const [problemId, startTime, endTime, friendId, myId] = roomId.split('_');
  const challengeDetails = {
    roomId,
    problemId,
    startTime: parseInt(startTime),
    endTime: parseInt(endTime),
    friendId,
    myId,
  };

  localStorage.setItem("activeChallenge", JSON.stringify(challengeDetails));
  window.location.href = `https://codeforces.com/problemset/problem/${problemId.slice(0, -1)}/${problemId.slice(-1)}`;
}

// Monitor Contest Start
function monitorContestStart(startTime, endTime, roomId) {
  if (Date.now() < startTime) {
    const interval = setInterval(() => {
      if (Date.now() >= startTime) {
        sendAlert(`Your contest with room ID: ${roomId} has started!`);
        startCountdown(endTime);
        clearInterval(interval);
      }
    }, 1000);
  }
}

// Start Countdown Timer
function startCountdown(endTime) {
  const timerDiv = document.getElementById("countdown-timer");
  timerDiv.style.display = "block";

  const updateTimer = () => {
    const currentTime = Date.now();
    const timeLeft = endTime - currentTime;

    if (timeLeft <= 0) {
      timerDiv.innerText = "Contest has ended!";
      timerDiv.style.background = "#e74c3c";
      clearInterval(timerInterval);
    } else {
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      timerDiv.innerText = `Time left: ${hours}h ${minutes}m ${seconds}s`;
    }
  };

  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);
}

// Monitor Friend Progress
function monitorFriendProgress(friendId, problemId, roomId) {
  const submissionsUrl = `https://codeforces.com/submissions/${friendId}`;
  let alertSent = false;

  const intervalId = setInterval(() => {
    if (alertSent) {
      clearInterval(intervalId);
      return;
    }

    fetch(submissionsUrl)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const table = doc.querySelector(".status-frame-datatable");
        if (!table) return;

        const firstRow = table.querySelector("tr[data-submission-id]");
        if (!firstRow) return;

        const problemLink = firstRow.querySelector("a[href*='/problem/']");
        const verdictElement = firstRow.querySelector(".status-verdict-cell .verdict-accepted");

        if (
          problemLink &&
          problemLink.getAttribute("href").includes(`/problem/${problemId.slice(-1)}`) &&
          problemLink.getAttribute("href").includes(`/contest/${problemId.slice(0, -1)}`) &&
          verdictElement
        ) {
          sendAlert(`${friendId} has solved the problem ${problemId} in room ID: ${roomId}!`);
          alertSent = true;
        }
      })
      .catch((err) => console.error("Error fetching submissions:", err));
  }, 3000);
}

// Monitor Contest End
function monitorContestEnd(endTime, roomId) {
  if (Date.now() < endTime) {
    const interval = setInterval(() => {
      if (Date.now() >= endTime) {
        sendAlert(`The contest with room ID: ${roomId} has ended!`);
        clearInterval(interval);
      }
    }, 1000);
  }
}

// Restore State After Reload
function restoreState() {
  const activeChallenge = JSON.parse(localStorage.getItem("activeChallenge"));
  if (activeChallenge) {
    const { startTime, endTime } = activeChallenge;
    const currentTime = Date.now();

    if (currentTime < startTime) {
      monitorContestStart(startTime, endTime, activeChallenge.roomId);
    } else if (currentTime >= startTime && currentTime <= endTime) {
      startCountdown(endTime);
    }
  }
}

// Send Alert
function sendAlert(message) {
  alert(message);
}

// Initialize
addChallengeButton();
restoreState();
