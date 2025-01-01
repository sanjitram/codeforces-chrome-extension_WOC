console.log("content.js loaded!");

// Add Challenge Button
function addChallengeButton() {
  const button = document.createElement("button");
  button.innerText = "Challenge a Friend";
  button.style.cssText =
    "position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #3498db; color: #fff; border: none; border-radius: 5px; cursor: pointer;";

  button.addEventListener("click", createChallenge);
  document.body.appendChild(button);
  console.log("Challenge button added!");

  // Add 'Join Challenge' Button
  const joinButton = document.createElement("button");
  joinButton.innerText = "Join Challenge";
  joinButton.style.cssText =
    "position: fixed; top: 50px; right: 10px; padding: 10px 20px; background: #e74c3c; color: #fff; border: none; border-radius: 5px; cursor: pointer;";

  joinButton.addEventListener("click", joinChallenge);
  document.body.appendChild(joinButton);
  console.log("Join button added!");
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

// Send Alert
function sendAlert(message) {
  alert(message);
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
  alert(`Challenge created! Room ID: ${roomId}`);

  monitorContestStart(startTime, roomId);
  monitorFriendProgress(friendId, problemId, roomId);
  monitorContestEnd(endTime, roomId);
}

// Monitor Contest Start
function monitorContestStart(startTime, roomId) {
  if (Date.now() < startTime) {
    const interval = setInterval(() => {
      if (Date.now() >= startTime) {
        sendAlert(`Your contest with room ID: ${roomId} has started!`);
        clearInterval(interval);
      }
    }, 1000);
  }
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

// Monitor Alerts
function monitorChallengeAlerts() {
  const challengeDetails = JSON.parse(localStorage.getItem("activeChallenge"));
  if (!challengeDetails) return;

  const { startTime, endTime, roomId } = challengeDetails;

  if (Date.now() < startTime) {
    setTimeout(() => {
      alert(`Your contest with room ID: ${roomId} has started!`);
    }, startTime - Date.now());
  }

  if (Date.now() < endTime) {
    setTimeout(() => {
      alert(`Your contest with room ID: ${roomId} has ended!`);
      localStorage.removeItem("activeChallenge");
    }, endTime - Date.now());
  }
}

// Initialize
addChallengeButton();
monitorChallengeAlerts();
