// Sticky Navbar
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Scroll Reveal Animations
function reveal() {
    var reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 150;
        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}
window.addEventListener("scroll", reveal);
// Trigger once on load
reveal();

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if(target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Contact Form Handler
const contactForm = document.getElementById('contactForm');
if(contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent page reload
        
        // Change button text temporarily
        const btn = this.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = "Sending...";
        
        // Simulate network request
        setTimeout(() => {
            btn.innerText = originalText;
            this.reset(); // clear form
            document.getElementById('formSuccess').style.display = 'block';
            
            // hide success message after 5 seconds
            setTimeout(() => {
                document.getElementById('formSuccess').style.display = 'none';
            }, 5000);
        }, 1500);
    });
}

// Patient AI Explainer Handler
const uploadZone = document.getElementById('uploadZone');
const browseBtn = document.getElementById('browseBtn');
const fileInput = document.getElementById('fileInput');
const loadingState = document.getElementById('loadingState');
const resultState = document.getElementById('resultState');
const resetBtn = document.getElementById('resetBtn');
const ttsBtn = document.getElementById('ttsBtn');

if(uploadZone && fileInput) {
    // Handle click to browse
    uploadZone.addEventListener('click', (e) => {
        if(e.target !== browseBtn) fileInput.click();
    });
    browseBtn.addEventListener('click', () => fileInput.click());

    // Drag and drop effects
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });
    function preventDefaults (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => uploadZone.classList.add('dragover'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => uploadZone.classList.remove('dragover'), false);
    });

    // Handle file selection/drop
    uploadZone.addEventListener('drop', (e) => {
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    });
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    let selectedFiles = [];
    const selectedFilesArea = document.getElementById('selectedFilesArea');
    const fileListUI = document.getElementById('fileList');
    const startAnalyzeBtn = document.getElementById('startAnalyzeBtn');

    function checkRateLimit() {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = localStorage.getItem('lastAnalysisDate');
        if (lastDate === today) {
            document.getElementById('premiumModal').style.display = 'flex';
            return false;
        }
        return true;
    }

    function renderFileList() {
        if(!fileListUI) return;
        fileListUI.innerHTML = '';
        selectedFiles.forEach((f, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `📄 ${f.name} <span style="color:#ff4444; cursor:pointer; float:right; padding-left:10px;" onclick="removeFile(${idx})">❌ Remove</span>`;
            li.style.marginBottom = '8px';
            li.style.padding = '8px 10px';
            li.style.background = 'rgba(255,255,255,0.05)';
            li.style.borderRadius = '5px';
            li.style.border = '1px solid var(--border-color)';
            fileListUI.appendChild(li);
        });
        if (selectedFiles.length > 0) {
            selectedFilesArea.style.display = 'block';
        } else {
            selectedFilesArea.style.display = 'none';
        }
    }

    // Make removeFile globally accessible for inline onclick
    window.removeFile = function(index) {
        selectedFiles.splice(index, 1);
        renderFileList();
    };

    function handleFiles(files) {
        if (!checkRateLimit()) return;

        let hasPDF = false;
        for (let i = 0; i < files.length; i++) {
            selectedFiles.push(files[i]);
            if (files[i].type === 'application/pdf') hasPDF = true;
        }

        renderFileList();

        // If it's a PDF, auto start. Otherwise wait for manual click.
        if (hasPDF) {
            startAnalysis();
        }
    }

    if(startAnalyzeBtn) {
        startAnalyzeBtn.addEventListener('click', startAnalysis);
    }

    async function startAnalysis() {
        if (selectedFiles.length === 0) return;
        if (!checkRateLimit()) return;

        uploadZone.style.display = 'none';
        loadingState.style.display = 'block';
        
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('file', file);
        });

        try {
            const response = await fetch('https://lab-ai-backend.cloudhostrj.workers.dev/', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                let errText = "Failed to process report";
                try {
                    const errJson = await response.json();
                    errText = errJson.error || errText;
                } catch(e) {}
                throw new Error(errText);
            }

            const data = await response.json();
            
            // Update the HTML with real AI response
            document.getElementById('hindiText').innerHTML = data.result || "Sorry, couldn't analyze the report.";
            
            // Mark usage for today (Rate Limiting)
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem('lastAnalysisDate', today);
            
            loadingState.style.display = 'none';
            resultState.style.display = 'block';
        } catch (error) {
            alert("Server Error: " + error.message);
            loadingState.style.display = 'none';
            uploadZone.style.display = 'block';
        }
    }

    // Reset button
    resetBtn.addEventListener('click', () => {
        selectedFiles = [];
        renderFileList();
        resultState.style.display = 'none';
        uploadZone.style.display = 'block';
        fileInput.value = '';
        window.speechSynthesis.cancel(); // Stop TTS if playing
        ttsBtn.innerText = "🔊 Bolkar Sunao (Listen)";
        ttsBtn.classList.remove('playing');
    });

    // Text to Speech
    let isPlaying = false;
    ttsBtn.addEventListener('click', () => {
        if(isPlaying) {
            window.speechSynthesis.cancel();
            isPlaying = false;
            ttsBtn.innerText = "🔊 Bolkar Sunao (Listen)";
            ttsBtn.classList.remove('playing');
            return;
        }

        const textToRead = document.getElementById('hindiText').innerText;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'hi-IN'; // Hindi
        utterance.rate = 0.9; // Slightly slower for clarity
        
        utterance.onend = () => {
            isPlaying = false;
            ttsBtn.innerText = "🔊 Bolkar Sunao (Listen)";
            ttsBtn.classList.remove('playing');
        };

        window.speechSynthesis.speak(utterance);
        isPlaying = true;
        ttsBtn.innerText = "⏸️ Stop Listening";
        ttsBtn.classList.add('playing');
    });
}
