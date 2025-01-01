import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify, render_template_string
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
import folium
import json

from math import radians, sin, cos, sqrt, atan2

import requests

import geopandas as gpd
from shapely.geometry import Point

from datetime import datetime

app = Flask(__name__)
socketio = SocketIO(app)

# Configure SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://loc_track_anavart_database_user:IZVtXm7dwnBw6lDSEqZajkFvFBoTDc8t@dpg-ctnth2t2ng1s73bf0un0-a/loc_track_anavart_database'  # Path to SQLite database file
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# world = gpd.read_file(gpd.datasets.get_path('naturalearth_lowres'))
world = gpd.read_file("ne_110m_admin_0_countries.shp")

# Define Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(255), unique=True, nullable=False)  # Unique device ID
    name = db.Column(db.String(255), nullable=False)  # User's name

class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('locations', lazy=True))
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
# Create tables
with app.app_context():
    db.create_all()

# Store the latest location
# latest_location = {"latitude": None, "longitude": None, "deviceID": None}

# Predefined locations
predef_locations = {
    "home": {"latitude": 22.991497097547864, "longitude": 72.60979031749606},  # Replace with your home coordinates
    "office": {"latitude": 23.152755532906006, "longitude": 72.5432677652376}  # Replace with Adani Shantigram coordinates
}

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the distance in meters between two latitude/longitude points.
    """
    R = 6371000  # Radius of the Earth in meters
    phi1 = radians(lat1)
    phi2 = radians(lat2)
    delta_phi = radians(lat2 - lat1)
    delta_lambda = radians(lon2 - lon1)

    a = sin(delta_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(delta_lambda / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c  # Distance in meters

def location_status(latest_location,locations):
    # Check proximity to home and office
    proximity_status = "Unknown Location"
    for place, coords in locations.items():
        distance = calculate_distance(
            latest_location["latitude"],
            latest_location["longitude"],
            coords["latitude"],
            coords["longitude"]
        )
        if distance <= 750:  # Adjust the proximity range (100 meters)
            proximity_status = place.capitalize()
            break

    if proximity_status == 'Office':
        notify = True
    else:
        notify = False
    
    return [proximity_status, int(distance), notify]

def get_location_name(latitude, longitude):
    """
    Use Nominatim Reverse Geocoding to get a human-readable address from latitude and longitude.
    """
    try:
        url = f"https://nominatim.openstreetmap.org/reverse"
        params = {
            "lat": latitude,
            "lon": longitude,
            "format": "json",
            "addressdetails": 1
        }
        headers = {
            "User-Agent": "YourAppName/1.0 (your_email@example.com)"  # Replace with your app name and contact info
        }
        response = requests.get(url, params=params, headers=headers)
        if response.status_code == 200:
            data = response.json()
            # Extract the location name from the response
            return data.get("display_name", "Unknown Location")
        else:
            return "Unknown Location"
    except Exception as e:
        print(f"Error in reverse geocoding: {e}")
        return "Unknown Location"
    
def get_point(lat, lon):
    return Point(lon, lat)


def rate_chart(world):

    Tier1_Countries = ['India']
    Tier2_Countries = ['United Kingdom', 'South Africa', 'Kenya', 'Canada']
    Tier3_Countries = ['United Arab Emirates', 'United States of America']

    world['Rating'] = [10]*len(world)
    for i in range(len(world)):
        if world['ADMIN'][i] in Tier1_Countries:
            world['Rating'][i] = 100
        elif world['ADMIN'][i] in Tier2_Countries:
            world['Rating'][i] = 60
        elif world['ADMIN'][i] in Tier3_Countries:
            world['Rating'][i] = 40
    
    return world

def get_country_rating(lat, lon, world):
    rated_world = rate_chart(world)
    point = get_point(lat, lon)
    for _, country in rated_world.iterrows():
        if country['geometry'].contains(point):
            return country['Rating']
    return 0

@app.route('/')
def home():
    return "Flask server is running!", 200

@app.route("/update_location", methods=["POST"])
def update_location():
    # global latest_location
    data = request.json  # Extract the JSON payload

    # Check for deviceId in the payload
    device_id = data.get("deviceId", "Unknown Device")

    # Check if the data is encapsulated under the "Text" key
    if "Text" in data:
        try:
            # Parse the JSON string under "Text"
            parsed_data = json.loads(data["Text"])
            latitude = parsed_data["latitude"]
            longitude = parsed_data["longitude"]
            # latest_location["deviceId"] = device_id  # Update with device ID
            # print(f"Updated Location: {latest_location}")
            
            # Find or create user
            user = User.query.filter_by(device_id=device_id).first()
            if not user:
                user = User(device_id=device_id, name=data.get("userName", "Unknown User"))
                db.session.add(user)
                db.session.commit()

            # Save location
            location = Location(latitude=latitude, longitude=longitude, user_id=user.id)
            db.session.add(location)
            db.session.commit()

            # Check for the proximity to know locations
            latest_location_for_proximity = {"latitude": latitude, "longitude": longitude}
            proximity = location_status(latest_location_for_proximity,predef_locations)

            # Get the exact location name using reverse geocoding
            location_name = get_location_name(latitude, longitude)

            location_rating = get_country_rating(latitude, longitude, world)

            # Notify clients to refresh the map
            socketio.emit('refresh_map', {'message': 'New location received'})

            return jsonify({
                "status": "success", 
                "message": f"You are currently at {location_name}.\n Rating for this location is {location_rating}", 
                "prox_status": proximity[0], 
                "dist": proximity[1], 
                "notify": proximity[2],
                "Rating": int(location_rating), 
                "deviceId": device_id}), 200
        
        except json.JSONDecodeError:
            return jsonify({"status": "error", "message": "Invalid JSON format in 'Text' key"}), 400

    return jsonify({"status": "error", "message": "Invalid data structure"}), 400

@app.route('/get_instructions', methods=['GET'])
def get_instructions():
    # For example, always tell the app: "We want your location" (requestLocation = true)
    return jsonify({
        "message": "Hello from the server!",
        "requestLocation": True
    }), 200

@app.route("/get_users", methods=["GET"])
def get_users():
    users = User.query.all()
    user_data = [{"id": user.id, "name": user.name, "device_id": user.device_id} for user in users]
    return jsonify(user_data), 200

@app.route("/get_locations", methods=["GET"])
def get_locations():
    locations = Location.query.all()
    location_data = [
        {
            "id": location.id,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "user_id": location.user_id,
            "user_name": location.user.name,
        }
        for location in locations
    ]
    return jsonify(location_data), 200

@app.route("/show_map", methods=["GET"])
def show_map():
    latest_location = Location.query.order_by(Location.id.desc()).first()
    if latest_location:
        user = User.query.get(latest_location.user_id)

        # Get the human-readable location name
        location_name = get_location_name(latest_location.latitude, latest_location.longitude)

        location_map = folium.Map(location=[latest_location.latitude, latest_location.longitude], zoom_start=15)
        folium.Marker(
            [latest_location.latitude, latest_location.longitude],
            popup=f"""
            <b>Device:</b> {user.device_id} ({user.name})<br>
            <b>Location:</b> {location_name}
            # <b>Latitude:</b> {latest_location.latitude}<br>
            # <b>Longitude:</b> {latest_location.longitude}
            """,
            icon=folium.Icon(color="blue", icon="info-sign"),
        ).add_to(location_map)
        map_html = location_map._repr_html_()

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