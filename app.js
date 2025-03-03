/** @type {AlarmSettings} */
let alarmSettings = {
    time: '',
    title: '',
    isActive: false
};

let isAlarmTriggered = false; // Add this flag at the top with other globals

/** @type {AlarmLog[]} */
let logs = [];

// Initialize from localStorage
function initializeApp() {
    const savedLogs = localStorage.getItem('alarmLogs');
    const savedSettings = localStorage.getItem('alarmSettings');
    
    if (savedLogs) {
        logs = JSON.parse(savedLogs);
        renderLogs();
    }
    
    if (savedSettings) {
        alarmSettings = JSON.parse(savedSettings);
        // Only restore saved time if alarm is active
        if (alarmSettings.isActive) {
            document.getElementById('alarmTime').value = alarmSettings.time;
        }
        document.getElementById('alarmTitle').value = alarmSettings.title;
        
        // Restore button state
        const toggleButton = document.getElementById('toggleAlarm');
        if (alarmSettings.isActive) {
            toggleButton.textContent = 'Stop Alarm';
            toggleButton.classList.remove('btn-primary');
            toggleButton.classList.add('btn-danger');
        } else {
            toggleButton.textContent = 'Start Alarm';
            toggleButton.classList.remove('btn-danger');
            toggleButton.classList.add('btn-primary');
        }
    }
}

/**
 * @param {number} minutes
 */
function adjustTime(minutes) {
    const timeInput = document.getElementById('alarmTime');
    if (!timeInput.value) return;

    const [hours, mins] = timeInput.value.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(mins + minutes);

    const newHours = String(date.getHours()).padStart(2, '0');
    const newMinutes = String(date.getMinutes()).padStart(2, '0');
    
    timeInput.value = `${newHours}:${newMinutes}`;
    alarmSettings.time = timeInput.value;

    // Log the adjustment
    const log = {
        buttonType: minutes > 0 ? `+${minutes}` : `${minutes}`,
        timestamp: new Date().toISOString(),
        note: '',
        color: minutes > 0 ? '#ffb3b3' : '#b3ffb3'
    };
    
    logs.push(log);
    saveToLocalStorage();
    renderLogs();
}

function renderLogs() {
    const tbody = document.getElementById('logTable');
    tbody.innerHTML = '';

    logs.forEach((log, index) => {
        const tr = document.createElement('tr');
        tr.style.backgroundColor = `${log.color}33`; // Adding transparency to the color
        tr.className = 'text-center align-middle';
        tr.innerHTML = `
            <td class="fw-bold">${new Date(log.timestamp).toLocaleTimeString()}</td>
            <td>
                <span class="badge rounded-pill fs-6 px-4 py-2" 
                      style="background-color: ${log.color}">
                    ${log.buttonType} min
                </span>
            </td>
            <td>
                <input type="text" 
                       class="form-control form-control-sm border-0 bg-transparent text-center" 
                       value="${log.note}" 
                       placeholder="Write something fun..." 
                       onchange="updateNote(${index}, this.value)">
            </td>
            <td>
                <button class="btn btn-sm btn-outline-danger rounded-circle" 
                        onclick="deleteLog(${index})">
                    ❌
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * @param {number} index
 * @param {string} note
 */
function updateNote(index, note) {
    logs[index].note = note;
    saveToLocalStorage();
}

/**
 * @param {number} index
 */
function deleteLog(index) {
    const log = logs[index];
    const minutes = parseInt(log.buttonType);
    
    // Update alarm time in reverse
    const timeInput = document.getElementById('alarmTime');
    if (timeInput.value) {
        const [hours, mins] = timeInput.value.split(':').map(Number);
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(mins - minutes); // Subtract the minutes that were added/removed

        const newHours = String(date.getHours()).padStart(2, '0');
        const newMinutes = String(date.getMinutes()).padStart(2, '0');
        
        timeInput.value = `${newHours}:${newMinutes}`;
        alarmSettings.time = timeInput.value;
    }

    // Remove log entry
    logs.splice(index, 1);
    saveToLocalStorage();
    renderLogs();
}

function saveToLocalStorage() {
    localStorage.setItem('alarmLogs', JSON.stringify(logs));
    localStorage.setItem('alarmSettings', JSON.stringify(alarmSettings));
}

// Update current time and check alarm
function updateTime() {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeString = `${currentHours}:${currentMinutes}`;
    
    document.getElementById('currentTime').textContent = currentTimeString;

    // Update next alarm display
    const nextAlarmElement = document.getElementById('nextAlarm');
    nextAlarmElement.textContent = alarmSettings.isActive ? 
        `${alarmSettings.time} (${alarmSettings.title || 'Alarm'})` : 'Not Set';

    // Update countdown
    if (alarmSettings.isActive && alarmSettings.time) {
        if (isAlarmTriggered) {
            document.getElementById('countdown').textContent = '00:00:00';
        } else {
            const [alarmHours, alarmMinutes] = alarmSettings.time.split(':').map(Number);
            let alarmTime = new Date();
            alarmTime.setHours(alarmHours, alarmMinutes, 0);

            // If alarm time is earlier than current time, set it for tomorrow
            if (alarmTime < now) {
                alarmTime.setDate(alarmTime.getDate() + 1);
            }

            const timeDiff = alarmTime - now;
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

            document.getElementById('countdown').textContent = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    } else {
        document.getElementById('countdown').textContent = '--:--:--';
    }

    // Check if alarm should ring
    if (alarmSettings.isActive && alarmSettings.time === currentTimeString && !isAlarmTriggered) {
        isAlarmTriggered = true; // Set flag to prevent multiple triggers
        playAlarmSequence();
        setTimeout(() => {
            alert(`Time for: ${alarmSettings.title || 'Your alarm!'}`);
            toggleAlarm();
            isAlarmTriggered = false; // Reset flag after alarm is handled
        }, 3000);
    }
}
// Add this function to handle button states
function updateAdjustmentButtons() {
    const buttons = document.querySelectorAll('[onclick^="adjustTime"]');
    buttons.forEach(button => {
        if (!alarmSettings.isActive) {
            button.disabled = true;
            button.classList.add('disabled');
            // Remove hover and click listeners when disabled
            button.removeEventListener('mouseenter', () => playHoverSound('adjust'));
            button.removeEventListener('click', () => playClickSound('adjust'));
        } else {
            button.disabled = false;
            button.classList.remove('disabled');
            // Re-add sound effects when enabled
            button.addEventListener('mouseenter', () => playHoverSound('adjust'));
            button.addEventListener('click', () => playClickSound('adjust'));
        }
    });
}

// Modify the toggleAlarm function
function toggleAlarm() {
    const toggleButton = document.getElementById('toggleAlarm');
    alarmSettings.isActive = !alarmSettings.isActive;
    isAlarmTriggered = false;
    
    if (alarmSettings.isActive) {
        toggleButton.textContent = 'Stop Alarm';
        toggleButton.classList.remove('btn-primary');
        toggleButton.classList.add('btn-danger');
    } else {
        toggleButton.textContent = 'Start Alarm';
        toggleButton.classList.remove('btn-danger');
        toggleButton.classList.add('btn-primary');
    }
    
    updateAdjustmentButtons(); // Add this line
    saveToLocalStorage();
}

// Add this to initializeApp function, just before the closing brace
function initializeApp() {
    const savedLogs = localStorage.getItem('alarmLogs');
    const savedSettings = localStorage.getItem('alarmSettings');
    
    if (savedLogs) {
        logs = JSON.parse(savedLogs);
        renderLogs();
    }
    
    if (savedSettings) {
        alarmSettings = JSON.parse(savedSettings);
        // Only restore saved time if alarm is active
        if (alarmSettings.isActive) {
            document.getElementById('alarmTime').value = alarmSettings.time;
        }
        document.getElementById('alarmTitle').value = alarmSettings.title;
        updateAdjustmentButtons(); // Add this line to disable buttons on initial load
        // Restore button state
        const toggleButton = document.getElementById('toggleAlarm');
        if (alarmSettings.isActive) {
            toggleButton.textContent = 'Stop Alarm';
            toggleButton.classList.remove('btn-primary');
            toggleButton.classList.add('btn-danger');
        } else {
            toggleButton.textContent = 'Start Alarm';
            toggleButton.classList.remove('btn-danger');
            toggleButton.classList.add('btn-primary');
        }
    }
}
// Add this to initializeApp function, just before the closing brace
function initializeApp() {
    const savedLogs = localStorage.getItem('alarmLogs');
    const savedSettings = localStorage.getItem('alarmSettings');
    
    if (savedLogs) {
        logs = JSON.parse(savedLogs);
        renderLogs();
    }
    
    if (savedSettings) {
        alarmSettings = JSON.parse(savedSettings);
        // Only restore saved time if alarm is active
        if (alarmSettings.isActive) {
            document.getElementById('alarmTime').value = alarmSettings.time;
        }
        document.getElementById('alarmTitle').value = alarmSettings.title;
        updateAdjustmentButtons(); // Add this line to disable buttons on initial load
        // Restore button state
        const toggleButton = document.getElementById('toggleAlarm');
        if (alarmSettings.isActive) {
            toggleButton.textContent = 'Stop Alarm';
            toggleButton.classList.remove('btn-primary');
            toggleButton.classList.add('btn-danger');
        } else {
            toggleButton.textContent = 'Start Alarm';
            toggleButton.classList.remove('btn-danger');
            toggleButton.classList.add('btn-primary');
        }
    }
}
function playAlarmSequence() {
    let beepCount = 0;
    
    function playBeep() {
        if (beepCount < 3) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = 800; // Frequency in Hz
            gainNode.gain.value = 0.1; // Volume control

            oscillator.start();
            
            // Stop the beep after 200ms
            setTimeout(() => {
                oscillator.stop();
                audioContext.close();
                beepCount++;
                setTimeout(playBeep, 800); // Wait 800ms before next beep
            }, 200);
        }
    }
    
    playBeep();
}

// Add event listener for toggle button
document.getElementById('toggleAlarm').addEventListener('click', toggleAlarm);

// Event Listeners
document.getElementById('alarmTime').addEventListener('change', (e) => {
    alarmSettings.time = e.target.value;
    saveToLocalStorage();
});

document.getElementById('alarmTitle').addEventListener('change', (e) => {
    alarmSettings.title = e.target.value;
    saveToLocalStorage();
});

// Set default time to current time + 1 minute when page loads if no time is set
function setDefaultTime() {
    if (!alarmSettings.time || !alarmSettings.isActive) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        const defaultHours = String(now.getHours()).padStart(2, '0');
        const defaultMinutes = String(now.getMinutes()).padStart(2, '0');
        const defaultTime = `${defaultHours}:${defaultMinutes}`;
        
        document.getElementById('alarmTime').value = defaultTime;
        alarmSettings.time = defaultTime;
        saveToLocalStorage();
    }
}
// Add this at the top with other global variables
let audioContext = null;

// Replace the existing click and hover sound functions with these versions
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playClickSound(buttonType = 'default') {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (buttonType) {
        case 'toggle':
            oscillator.type = 'square';
            oscillator.frequency.value = 2400;
            gainNode.gain.value = 0.07;
            break;
        case 'adjust':
            oscillator.type = 'sine';
            oscillator.frequency.value = 1800;
            gainNode.gain.value = 0.05;
            break;
        default:
            oscillator.type = 'sine';
            oscillator.frequency.value = 2000;
            gainNode.gain.value = 0.05;
    }

    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
    }, 50);
}

function playHoverSound(buttonType = 'default') {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Softer attack and release
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.02, audioContext.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);

    switch (buttonType) {
        case 'toggle':
            oscillator.type = 'sine';
            oscillator.frequency.value = 392.00; // G4 - a pleasant, neutral note
            break;
        case '-10':
            oscillator.type = 'sine';
            oscillator.frequency.value = 523.25; // C5
            break;
        case '-5':
            oscillator.type = 'sine';
            oscillator.frequency.value = 587.33; // D5
            break;
        case '+5':
            oscillator.type = 'sine';
            oscillator.frequency.value = 659.25; // E5
            break;
        case '+10':
            oscillator.type = 'sine';
            oscillator.frequency.value = 698.46; // F5
            break;
        default:
            oscillator.type = 'sine';
            oscillator.frequency.value = 440;
    }

    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
    }, 150); // Longer duration for smoother sound
}

// Modify the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // Initialize audio context on first click anywhere on the page
    document.addEventListener('click', () => {
        initAudioContext();
    }, { once: true });

    // Add specific sound for toggle alarm button
    const toggleButton = document.getElementById('toggleAlarm');
    toggleButton.addEventListener('mouseenter', () => playHoverSound('toggle'));
    toggleButton.addEventListener('click', () => playClickSound('toggle'));

    // Add specific sound for adjustment buttons
    document.querySelectorAll('button').forEach(button => {
        if (button.id !== 'toggleAlarm') {
            const minutes = button.getAttribute('onclick').match(/-?\d+/)[0];
            button.addEventListener('mouseenter', () => playHoverSound(minutes > 0 ? `+${minutes}` : minutes));
            button.addEventListener('click', () => playClickSound('adjust'));
        }
    });
});
// Initialize the app
initializeApp();
setDefaultTime(); // Add this line after initializeApp
updateAdjustmentButtons(); // Add this line to disable buttons on initial load
// Update time every second
setInterval(updateTime, 1000);