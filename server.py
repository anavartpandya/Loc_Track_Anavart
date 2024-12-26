from flask import Flask, request, jsonify, render_template_string
from flask_socketio import SocketIO
import folium
import json
import eventlet

app = Flask(__name__)
socketio = SocketIO(app)

# Store the latest location
latest_location = {"latitude": None, "longitude": None}

@app.route('/')
def home():
    return "Flask server is running!", 200

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

            # Notify clients to refresh the map
            socketio.emit('refresh_map', {'message': 'New location received'})

            return jsonify({"status": "success", "message": "Location updated!"}), 200
        except json.JSONDecodeError:
            return jsonify({"status": "error", "message": "Invalid JSON format in 'Text' key"}), 400

    return jsonify({"status": "error", "message": "Invalid data structure"}), 400

@app.route("/show_map", methods=["GET"])
def show_map():
    if latest_location["latitude"] and latest_location["longitude"]:
        # Generate a map dynamically
        location_map = folium.Map(
            location=[latest_location["latitude"], latest_location["longitude"]], zoom_start=15
        )
        folium.Marker(
            [latest_location["latitude"], latest_location["longitude"]],
            popup="Phone Location",
            icon=folium.Icon(color="blue", icon="info-sign")
        ).add_to(location_map)
        map_html = location_map._repr_html_()  # Render the map as an HTML string

        # Return the map embedded with WebSocket support
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Location Map</title>
            <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
        </head>
        <body>
            <h1>Live Location Map</h1>
            <div>{map_html}</div>
            <script>
                // Connect to the WebSocket server
                const socket = io();

                // Listen for the "refresh_map" event
                socket.on('refresh_map', function(data) {{
                    console.log(data.message);
                    // Reload the page to display the updated map
                    location.reload();
                }});
            </script>
        </body>
        </html>
        """
        return render_template_string(html_template)
    return jsonify({"status": "error", "message": "No location data available"}), 400

if __name__ == '__main__':
    eventlet.monkey_patch()
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)