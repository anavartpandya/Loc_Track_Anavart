from flask import Flask, request, jsonify
from flask import send_file
import os
import folium
import webbrowser
import json

app = Flask(__name__)

@app.route('/')
def home():
    return "Flask server is running!", 200

# Store the latest location
latest_location = {"latitude": None, "longitude": None}

@app.route("/update_location", methods=["POST"])
def update_location():
    global latest_location
    data = request.json  # Extract the JSON payload
    
    # Check if the data is encapsulated under the "Text" key
    if "Text" in data:
        try:
            # Parse the JSON string under "Text"
            parsed_data = json.loads(data["Text"])
            latest_location["latitude"] = parsed_data["latitude"]
            latest_location["longitude"] = parsed_data["longitude"]
            print(f"Updated Location: {latest_location}")
            return jsonify({"status": "success", "message": "Location updated!"}), 200
        except json.JSONDecodeError:
            return jsonify({"status": "error", "message": "Invalid JSON format in 'Text' key"}), 400

    return jsonify({"status": "error", "message": "Invalid data structure"}), 400

@app.route("/show_map", methods=["GET"])
def show_map():
    if latest_location["latitude"] and latest_location["longitude"]:
        # Generate a map centered on the latest location
        location_map = folium.Map(location=[latest_location["latitude"], latest_location["longitude"]], zoom_start=15)
        folium.Marker(
            [latest_location["latitude"], latest_location["longitude"]],
            popup="Phone Location",
            icon=folium.Icon(color="blue", icon="info-sign")
        ).add_to(location_map)
        
        # Save the map as an HTML file
        map_file = "phone_location.html"
        location_map.save(map_file)

        # Serve the map file
        return send_file(map_file, mimetype='text/html')

    return jsonify({"status": "error", "message": "No location data available"}), 400

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
