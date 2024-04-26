let imageFileName; // Store the file name
let dynamicTitle; // Store the translated text to set as title attribute
let fileSelected = false; // Flag to track if the event handler has been triggered

document.getElementById('fileInput').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    
    if (!file) return;
     


    // Set flag to true to indicate that event handler has been triggered
    fileSelected = true;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const imageSrc = e.target.result;
        imageFileName = event.target.value.split('\\').pop(); // Extract file name
        console.log(imageFileName);

        // Display the uploaded image
        document.getElementById('uploadedImage').src = imageSrc;

        // Fetch text data when image is changed
        await fetchTextData(file);
    };



    reader.readAsDataURL(file);
});

// Function to fetch text data from the backend
async function fetchTextData(file) {
        // Show loader
        document.getElementById('loader').style.display ='block';
    const formData = new FormData();
    formData.append('file', file);

    const url = 'http://127.0.0.1:5000/detect_text'; // Adjust this to your server endpoint

    const options = {
        method: 'POST',
        body: formData
    };

    try {
        const response = await fetch(url, options);
        const textData = await response.json();
      console.log(textData);
        dynamicTitle = textData[0].translated_text;
      console.log(dynamicTitle)
         //Hide loader when response is received 
  document.getElementById('loader' ).style.display ='none';
        // Display translated text overlays
        textData.forEach(({ bounding_box, translated_text }) => {
            const overlay = createOverlayElement(bounding_box, translated_text);
            document.getElementById('imageContainer').appendChild(overlay);
        });
    } catch (error) {
        console.error('Error:', error);
    }

    // Reset the fileSelected flag after processing the file
    fileSelected = false;
}

// Function to create translated text overlay element for each line of text
function createOverlayElement(boundingBox, translatedText) {
    const overlay = document.createElement('div');
    overlay.classList.add('translated-text-overlay');
    overlay.textContent = translatedText;
    overlay.title = translatedText;
    
    // Calculate position relative to image container size
    const imageContainer = document.getElementById('imageContainer');
    const containerWidth = imageContainer.offsetWidth;
    const containerHeight = imageContainer.offsetHeight;
    const imageWidth = document.getElementById('uploadedImage').naturalWidth;
    const imageHeight = document.getElementById('uploadedImage').naturalHeight;
    imageContainer.setAttribute("title", dynamicTitle);

    // Calculate left and top positions
    const left = (boundingBox[0] / imageWidth) * containerWidth;
    const top = (boundingBox[1] / imageHeight) * containerHeight;

    overlay.style.position = 'absolute';
    overlay.style.left = `${left}px`;
    overlay.style.top = `${top}px`;
    overlay.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
    overlay.style.opacity = "-0.5";
    overlay.style.cursor = "pointer";

    return overlay;
}