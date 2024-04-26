from flask import Flask, request, jsonify, render_template
from google.cloud import translate_v2 as translate
from google.cloud import vision
import os
from flask_cors import CORS
import io
from PIL import Image
# Set Google Cloud credentials environment variable
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'imgtranslation_key.json'

# Initialize Flask app
app = Flask(__name__)
CORS(app)

@app.route('/detect_text', methods=['GET', 'POST'])
def detect_text_endpoint():
    # if request.method == 'GET':
    #     return render_template('index.html')
    # else:
        # Check if image file is sent in the request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'})

        #file = request.files['file']
        #image_file1 = file.read()

        # Process the binary data (example: convert to PIL Image)
        #image_file = Image.open(io.BytesIO(image_file1))
        # Get the uploaded image file
        image_file = request.files['file']

        # Initialize Google Cloud Vision and Translate clients
        vision_client = vision.ImageAnnotatorClient()
        translate_client = translate.Client()

        # Read the image content
        content = image_file.read()
        image = vision.Image(content=content)

        # Perform text detection
        response = vision_client.document_text_detection(image=image)
        texts = response.text_annotations

        # Process detected text and translate non-English text to English
        def is_alphanumeric(input_string):
            return input_string.isalnum()
        output_data = []
        #for text in texts[1:]:
        for text in texts:
            if (text.description.strip()!='...' and text.description.strip()!='!' and text.description.strip()!='..'):
                try:
                    detection = translate_client.detect_language(text.description)
                    source_language = detection['language']
                    if source_language != 'en':
                        try:

                            translation = translate_client.translate(text.description, target_language='en', source_language=source_language)
                        except Exception as e:
                            if 'source language: und' in str(e):
                                # Handle undefined source language error
                                translation = translate_client.translate(text.description, target_language='en')


                        # Extract x and y coordinates for bounding box
                        x_values=[]
                        for vertex in text.bounding_poly.vertices:
                            x_values.append(vertex.x)
                            x_values.append(vertex.y)

                        line_data = {
                            "bounding_box": x_values,
                            "original_text": text.description,
                            "translated_text": translation['translatedText']
                        }
                        output_data.append(line_data)
                except Exception as e:
                    print(f"Exception occurred for item: {e}")
                    continue

        # Return the output data as JSON response
        return jsonify(output_data)

if __name__ == '__main__':
    app.run(debug=True)
