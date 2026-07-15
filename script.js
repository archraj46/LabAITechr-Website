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

    function handleFiles(files) {
        if(files.length > 0) {
            // Fake upload and analysis process
            uploadZone.style.display = 'none';
            loadingState.style.display = 'block';
            
            // Wait 3 seconds then show results
            setTimeout(() => {
                loadingState.style.display = 'none';
                resultState.style.display = 'block';
            }, 3000);
        }
    }

    // Reset button
    resetBtn.addEventListener('click', () => {
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
