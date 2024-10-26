from flask import Flask, request, render_template, jsonify
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
import torch
import base64
from io import BytesIO

# Create the Flask app
app = Flask(__name__)

# Load the processor and model
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

# Define the home route
@app.route('/')
def home():
    return render_template('index.html')

# Define the caption route
@app.route('/caption', methods=['POST'])
def caption():
    if 'file' in request.files:  # For file uploads
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        # Process the image from file upload
        image = Image.open(file.stream).convert("RGB")
        
    elif request.is_json:  # For JSON data from camera capture
        data = request.get_json()
        image_data = data.get('image')
        if not image_data:
            return jsonify({"error": "No image provided"}), 400

        # Decode the base64 image
        image_data = image_data.split(',')[1]  # Remove the data:image/png;base64, part
        image = Image.open(BytesIO(base64.b64decode(image_data))).convert("RGB")
        
    else:
        return jsonify({"error": "Invalid request format"}), 400

    # Generate caption
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        outputs = model.generate(**inputs)
    caption = processor.decode(outputs[0], skip_special_tokens=True)

    return jsonify({"caption": caption})

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)
