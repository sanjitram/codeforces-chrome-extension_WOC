// Add Challenge Button to Codeforces Problem Page

console.log("content.js loaded!");
function addChallengeButton() {
  const button = document.createElement("button");
  button.innerText = "Challenge a Friend";
  button.style.cssText =
    "position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #3498db; color: #fff; border: none; border-radius: 5px; cursor: pointer;";

  button.addEventListener("click", createChallenge);
  document.body.appendChild(button);
  console.log("Challenge button added!");
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

// Monitor Friend's Progress
// function monitorFriendProgress(friendId, problemId, roomId) {
//   // Construct the URL for the friend's submissions page
//   const submissionsUrl = `https://codeforces.com/submissions/${friendId}`;

//   // Set an interval to periodically check the submissions
//   setInterval(() => {
//     // Fetch the HTML content of the submissions page
//     fetch(submissionsUrl)
//       .then((response) => response.text())
//       .then((html) => {
//         // Parse the fetched HTML content
//         const parser = new DOMParser();
//         const doc = parser.parseFromString(html, "text/html");

//         // Get all the rows in the submissions table
//         const rows = doc.querySelectorAll(".status-frame-datatable tr");

//         // Initialize a flag to check if the problem has been solved
//         let solved = false;

//         // Iterate through each row in the table to check for the problem's submission
//         rows.forEach((row) => {
//           // Find the link to the problem in the row
//           const problemLink = row.querySelector("a[href*='/problem/']");
//           // Find the verdict cell in the row
//           const verdict = row.querySelector(".submissionVerdictWrapper");

//           // Check if the row contains the correct problem and if the verdict is "Accepted"
//           if (
//             problemLink &&
//             problemLink.getAttribute("href").includes(problemId) &&
//             verdict &&
//             verdict.innerText.includes("Accepted")
//           ) {
//             solved = true; // Mark the problem as solved
//           }
//         });

//         // If the problem is solved, send an alert
//         if (solved) {
//           sendAlert(
//             `${friendId} has solved the problem in room ID: ${roomId}!`
//           );
//         }
//       })
//       .catch((err) => console.error("Error fetching submissions:", err)); // Handle fetch errors
//   }, 5000); // Check every 5 seconds
// }

function monitorFriendProgress(friendId, problemId, roomId) {
    const submissionsUrl = `https://codeforces.com/submissions/${friendId}`;
  
    setInterval(() => {
      fetch(submissionsUrl)
        .then((response) => response.text())
        .then((html) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
  
          const rows = doc.querySelectorAll(".status-frame-datatable tr");
          let solved = false;
  
          for (const row of rows) {
            const problemLink = row.querySelector("a[href*='/problem/']");
            const verdict = row.querySelector(".submissionVerdictWrapper");
  
            console.log("Problem Link:", problemLink?.getAttribute("href"));
            console.log("Verdict:", verdict?.innerText);
  
            if (
              problemLink &&
              problemLink.getAttribute("href").includes(problemId) &&
              verdict &&
              verdict.innerText.trim().toLowerCase().includes("accepted")
            ) {
              solved = true;
              break;
            }
          }
  
          if (solved) {
            console.log(`${friendId} has solved the problem in room ID: ${roomId}!`);
          }
        })
        .catch((err) => console.error("Error fetching submissions:", err));
    }, 30000);
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

// Initialize
addChallengeButton();
