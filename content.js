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

  // Get the current date and set the time
  const now = new Date();
  now.setHours(hours, minutes, seconds, 0); // Set the time (hh:mm:ss)

  return now.getTime(); // Return full timestamp in milliseconds
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

  // Input start and end time in hh:mm:ss format
  const startTimeStr = prompt("Enter the challenge start time (hh:mm:ss):");
  const endTimeStr = prompt("Enter the challenge end time (hh:mm:ss):");

  const startTime = timeToMilliseconds(startTimeStr);
  const endTime = timeToMilliseconds(endTimeStr);

  if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
    alert(
      "Invalid input! Please enter valid start and end times in hh:mm:ss format."
    );
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

  // Save to localStorage
  localStorage.setItem("challengeDetails", JSON.stringify(challengeDetails));

  console.log("Before alert");
  alert(`Challenge created! Room ID: ${roomId}`);
  console.log("After alert");

  // Start monitoring the contest
  console.log("Monitoring contest start...");
  monitorContestStart(startTime, roomId);
  console.log("Monitoring friend start...");
  monitorFriendProgress(friendId, problemId, roomId);
  console.log("Monitoring contest end...");
  monitorContestEnd(endTime, roomId);
}

// Monitor Contest Start
function monitorContestStart(startTime, roomId) {
  console.log("Checking contest start...");
  console.log("Current Time:", Date.now());
  console.log("Start Time:", startTime);
  if (Date.now() < startTime) {
    const interval = setInterval(() => {
      const currentTime = Date.now();

      console.log("Checking contest start time...1");
      console.log("Current Time: 1", currentTime);
      console.log("Start Time: 1", startTime);
      if (currentTime >= startTime && currentTime < startTime + 1000) {
        sendAlert(`Your contest with room ID: ${roomId} has started!`);
        clearInterval(interval); // Stop checking after the contest starts
      }
    }, 1000); // Check every 1 second
  }
}

// Function to monitor the friend's progress
function monitorFriendProgress(friendId, problemId, roomId) {
  const submissionsUrl = `https://codeforces.com/submissions/${friendId}`;
  let alertSent = false; // Track whether the alert has been sent

  // Poll the submissions page every 30 seconds
  const intervalId = setInterval(() => {
    if (alertSent) {
      clearInterval(intervalId); // Stop the interval if the alert has been sent
      return;
    }

    fetch(submissionsUrl)
      .then((response) => response.text())
      .then((html) => {
        // Parse the HTML response
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Locate the submissions table
        const table = doc.querySelector(".status-frame-datatable");

        if (!table) {
          console.error("Submissions table not found!");
          return;
        }

        // Locate the first row of submissions (excluding header row)
        const firstRow = table.querySelector("tr[data-submission-id]");
        if (!firstRow) {
          console.log("No submissions found.");
          return;
        }

        // Extract the problem link and verdict
        const problemLink = firstRow.querySelector("a[href*='/problem/']");
        const verdictElement = firstRow.querySelector(".status-verdict-cell .verdict-accepted");

        // Check if the problem matches the target and the verdict is "Accepted"
        if (
          problemLink &&
          problemLink.getAttribute("href").includes(`/problem/${problemId.slice(-1)}`) && // Match problem letter
          problemLink.getAttribute("href").includes(`/contest/${problemId.slice(0, -1)}`) && // Match contest ID
          verdictElement
        ) {
          sendAlert(`${friendId} has solved the problem ${problemId} in room ID: ${roomId}!`);
          alertSent = true; // Mark alert as sent
        }
      })
      .catch((err) => console.error("Error fetching submissions:", err));
  }, 3000); // Check every 30 seconds
}

// Monitor Contest End
function monitorContestEnd(endTime, roomId) {
  console.log("Checking contest end...");
  console.log("Current Time:", Date.now());
  console.log("end Time:", endTime);
  if (Date.now() < endTime) {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      console.log("Checking contest end...1");
      console.log("Current Time:1", Date.now());
      console.log("End Time:1", endTime);
      if (currentTime >= endTime && currentTime < endTime + 1000) {
        sendAlert(`The contest with room ID: ${roomId} has ended!`);
        clearInterval(interval); // Stop checking after the contest ends
      }
    }, 1000); // Check every 1 second
  }
}

// Join Challenge Function
function joinChallenge() {
  const roomId = prompt("Enter the Room ID:");

  // Validate the roomId format (example: "1234A_1735673400000_1735675200000_friendID_myID")
  const roomIdPattern = /^\d+[A-Za-z]_\d{13}_\d{13}_[\w\d]+_[\w\d]+$/;

  if (!roomIdPattern.test(roomId)) {
    alert("Invalid Room ID format. Please enter a valid Room ID.");
    return;
  }

  // Extract the problemId, startTime, endTime, and myId from the roomId
  const [problemId, startTime, endTime, friendId, myId] = roomId.split('_');

  // Navigate to the problem page on Codeforces
  window.location.href = `https://codeforces.com/problemset/problem/${problemId.slice(0, -1)}/${problemId.slice(-1)}`;

  // Monitor the contest start and end
  monitorContestStart(parseInt(startTime), roomId);
  monitorContestEnd(parseInt(endTime), roomId);

  // Monitor the challenge creator's progress by checking if they have solved the problem
  const creatorSubmissionsUrl = `https://codeforces.com/submissions/${myId}`;
  let alertSent = false; // Track whether the alert has been sent

  // Poll the submissions page every 30 seconds
  const intervalId = setInterval(() => {
    if (alertSent) {
      clearInterval(intervalId); // Stop the interval if the alert has been sent
      return;
    }

    fetch(creatorSubmissionsUrl)
      .then((response) => response.text())
      .then((html) => {
        // Parse the HTML response
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Locate the submissions table
        const table = doc.querySelector(".status-frame-datatable");

        if (!table) {
          console.error("Submissions table not found!");
          return;
        }

        // Locate the first row of submissions (excluding header row)
        const firstRow = table.querySelector("tr[data-submission-id]");
        if (!firstRow) {
          console.log("No submissions found.");
          return;
        }

        // Extract the problem link and verdict
        const problemLink = firstRow.querySelector("a[href*='/problem/']");
        const verdictElement = firstRow.querySelector(".status-verdict-cell .verdict-accepted");

        // Check if the problem matches the target and the verdict is "Accepted"
        if (
          problemLink &&
          problemLink.getAttribute("href").includes(`/problem/${problemId.slice(-1)}`) && // Match problem letter
          problemLink.getAttribute("href").includes(`/contest/${problemId.slice(0, -1)}`) && // Match contest ID
          verdictElement
        ) {
          sendAlert(`${myId} (the challenge creator) has solved the problem ${problemId} in room ID: ${roomId}!`);
          alertSent = true; // Mark alert as sent
        }
      })
      .catch((err) => console.error("Error fetching submissions:", err));
  }, 3000); // Check every 30 seconds
}

// Initialize
addChallengeButton();
