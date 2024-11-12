const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureButton = document.getElementById('capture');
const uploadButton = document.getElementById('upload');
const retakeButton = document.getElementById('retake');
const capturedImage = document.getElementById('captured-image');
const captionDisplay = document.getElementById('caption');
const loadingMessage = document.getElementById('loadingMessage');
const context = canvas.getContext('2d');

const uploadSection = document.getElementById('uploadSection');
const cameraSection = document.getElementById('cameraSection');
const uploadImageButton = document.getElementById('uploadImageButton');
const selectUpload = document.getElementById('selectUpload');
const selectCamera = document.getElementById('selectCamera');

let streamStarted = false;

// Handle the "Upload from Device" button click
selectUpload.addEventListener('click', () => {
    uploadSection.classList.add('visible'); // Show upload section
    cameraSection.classList.remove('visible'); // Hide camera section
});

// Handle the "Use Camera" button click
selectCamera.addEventListener('click', () => {
    cameraSection.classList.add('visible'); // Show camera section
    uploadSection.classList.remove('visible'); // Hide upload section

    if (!streamStarted) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                video.srcObject = stream;
                streamStarted = true;
            })
            .catch(error => {
                console.error("Error accessing the camera:", error);
                alert("Could not access the camera. Please check your device permissions.");
            });
    }
});

// Capture the image when the "Capture Photo" button is clicked
captureButton.addEventListener('click', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/png');
    capturedImage.src = imageData;
    capturedImage.style.display = 'block';

    canvas.style.display = 'none';
    video.style.display = 'none';
    
    uploadButton.style.display = 'inline-block';
    retakeButton.style.display = 'inline-block';
    captureButton.style.display = 'none';
});

// Upload the captured photo to the server for captioning
uploadButton.addEventListener('click', () => {
    const imageData = capturedImage.src;

    loadingMessage.style.display = 'block';

    fetch('/caption', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: imageData })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok: " + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        loadingMessage.style.display = 'none';

        if (data.caption) {
            captionDisplay.textContent = data.caption;
        } else {
            console.error("Unexpected response format:", data);
            captionDisplay.textContent = "Failed to generate caption. Please try again.";
        }
    })
    .catch(error => {
        loadingMessage.style.display = 'none';
        console.error("Error uploading image:", error);
        captionDisplay.textContent = "An error occurred. Please check the console for details.";
    });
});

// Retake the photo by resetting the view
retakeButton.addEventListener('click', () => {
    capturedImage.style.display = 'none';
    uploadButton.style.display = 'none';
    retakeButton.style.display = 'none';
    
    captionDisplay.textContent = "";

    video.style.display = 'block';
    captureButton.style.display = 'inline-block';
});

// Handle file upload form submission
uploadImageButton.addEventListener('click', () => {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select an image file to upload.");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    loadingMessage.style.display = 'block';

    fetch('/caption', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok: " + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        loadingMessage.style.display = 'none';

        if (data.caption) {
            captionDisplay.textContent = data.caption;
        } else {
            console.error("Unexpected response format:", data);
            captionDisplay.textContent = "Failed to generate caption. Please try again.";
        }
    })
    .catch(error => {
        loadingMessage.style.display = 'none';
        console.error("Error uploading image:", error);
        captionDisplay.textContent = "An error occurred. Please check the console for details.";
    });
});
