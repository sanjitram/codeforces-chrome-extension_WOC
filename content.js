console.log("blah");
const activeIntervals = {};
const solvedProblems = {}; 
function copyToClipboard(text) {
  //clipboard stuff
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert("Text copied to clipboard!");
    }).catch((err) => {
      console.error("Failed to copy text: ", err);
    });
  } else {
    
    alert("Clipboard API not available.");
  }
}

function base64Encode(str) {
  return btoa(str);
}

function base64Decode(str) {
  return atob(str);
}



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
    "position: fixed; top: 90px; right: 10px; padding: 10px; background: #2ecc71; color: #fff; border-radius: 5px; display: none; font-size: 12px;";
  document.body.appendChild(timerDiv);
  console.log("Countdown timer added!");

  restoreState();
}

function generateRoomId(problemId, startTime, endTime, friendId, myId) {
  const randomNumber = Math.floor(1000 + Math.random() * 9000); 
  const plainRoomId = `${problemId}_${startTime}_${endTime}_${friendId}_${myId}_${randomNumber}`;
  return base64Encode(plainRoomId);  
}

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
  copyToClipboard(roomId);
  alert(`Challenge created! Room ID: ${roomId} copied to clipboard....`);
  
  window.location.href = `https://codeforces.com/problemset/problem/${problemId.slice(0, -1)}/${problemId.slice(-1)}`;

  monitorContestStart(startTime, endTime, roomId);
  monitorFriendProgress(friendId, problemId, roomId);
  monitorContestEnd(endTime, roomId);
  restoreState();
}

function joinChallenge() {
  const encryptedRoomId = prompt("Enter the Room ID:");
  
  try {
    const roomId = base64Decode(encryptedRoomId);  // Decrypting
    const roomIdPattern = /^\d+[A-Za-z]_\d{13}_\d{13}_[\w\d]+_[\w\d]+_\d{4}$/;

    if (!roomIdPattern.test(roomId)) {
      alert("Invalid Room ID format. Please enter a valid Room ID.");
      return;
    }

    const roomIdParts = roomId.split('_');
    if (roomIdParts.length !== 6) {
      alert("Invalid Room ID format. Room ID is incomplete.");
      return;
    }

    const [problemId, startTime, endTime, friendId, myId, randomNumber] = roomIdParts;
    const challengeDetails = {
      roomId: encryptedRoomId,  
      problemId,
      startTime: parseInt(startTime),
      endTime: parseInt(endTime),
      friendId,
      myId,
      randomNumber,
    };

    localStorage.setItem("activeChallenge", JSON.stringify(challengeDetails));
    alert(`Challenge joined! Room ID: ${encryptedRoomId}`);

    monitorContestStart(challengeDetails.startTime, challengeDetails.endTime, roomId);
    monitorFriendProgress(myId, problemId, roomId);
    monitorContestEnd(challengeDetails.endTime, roomId);

    restoreState();

    window.location.href = `https://codeforces.com/problemset/problem/${problemId.slice(0, -1)}/${problemId.slice(-1)}`;
  } catch (error) {
    alert("Invalid Room ID. Please enter a valid encrypted Room ID.");
  }
}



function monitorContestStart(startTime, endTime, roomId) {
  if (Date.now() < startTime) {
    const interval = setInterval(() => {
      if (Date.now() >= startTime) {
        alert(`Your contest with room ID: ${roomId} has started!`);
        startCountdown(endTime);
        clearInterval(interval);
      }
    }, 1000);
  }
}


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

// Mod
function monitorFriendProgress(userId, problemId, roomId) {
  const submissionsUrl = `https://codeforces.com/submissions/${userId}`;


  if (!solvedProblems[userId]) {
    solvedProblems[userId] = new Set(); 
  }

  
  if (solvedProblems[userId].has(problemId)) {
    return;
  }


  if (activeIntervals[`progress_${userId}_${problemId}`]) {
    return;
  }

  
  let lastProcessedSubmissionId = null;

  const interval = setInterval(() => {
    if (solvedProblems[userId].has(problemId)) {
      clearInterval(interval);
      delete activeIntervals[`progress_${userId}_${problemId}`];
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

        const submissionId = firstRow.getAttribute("data-submission-id");
        
        // Skip
        if (submissionId === lastProcessedSubmissionId) {
          return;
        }
        
        lastProcessedSubmissionId = submissionId;

        const problemLink = firstRow.querySelector("a[href*='/problem/']");
        const verdictElement = firstRow.querySelector(".status-verdict-cell .verdict-accepted");

        if (
          problemLink &&
          problemLink.getAttribute("href").includes(`/problem/${problemId.slice(-1)}`) &&
          problemLink.getAttribute("href").includes(`/contest/${problemId.slice(0, -1)}`) &&
          verdictElement &&
          !solvedProblems[userId].has(problemId) 
        ) {
          solvedProblems[userId].add(problemId);
         
          sendAlert(`${userId} has solved the problem ${problemId} in room ID: ${roomId}!`);

          clearInterval(interval);
          delete activeIntervals[`progress_${userId}_${problemId}`];
        }
      })
      .catch((err) => console.error("Error fetching submissions:", err));
  }, 5000);

  activeIntervals[`progress_${userId}_${problemId}`] = interval;
}
function monitorContestEnd(endTime, roomId) {
  const interval = setInterval(() => {
    const currentTime = Date.now();
    
    if (currentTime >= endTime) {
      clearInterval(interval);
      sendAlert(`The contest with room ID: ${roomId} has ended!`);
      
      
      const timerDiv = document.getElementById("countdown-timer");
      if (timerDiv) {
        timerDiv.style.display = "none";
      }
    }
  }, 1000);
}


function restoreState() {
  const activeChallenge = JSON.parse(localStorage.getItem("activeChallenge"));

  if (activeChallenge) {
    const { startTime, endTime, roomId, problemId, myId, friendId } = activeChallenge;

    if (!startTime || !endTime || !roomId || !problemId || !myId || !friendId) {
      console.error("Incomplete challenge data in localStorage. Resetting state.");
      localStorage.removeItem("activeChallenge");
      return;
    }

    const currentTime = Date.now();

    if (currentTime < startTime) {
      monitorContestStart(startTime, endTime, roomId);
    } else if (currentTime >= startTime && currentTime <= endTime) {
      startCountdown(endTime);
      monitorContestEnd(endTime, roomId);
    }

    
    if (!activeIntervals[`progress_${myId}_${problemId}`]) {
      monitorFriendProgress(myId, problemId, roomId);
    }
    if (!activeIntervals[`progress_${friendId}_${problemId}`]) {
      monitorFriendProgress(friendId, problemId, roomId);
    }
  } else {
    console.log("No active challenge to restore.");
  }
}


function sendAlert(message) {
  alert(message);
}


addChallengeButton();
restoreState();
