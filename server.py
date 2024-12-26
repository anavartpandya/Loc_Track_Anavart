from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/update_location', methods=['POST'])
def update_location():
    data = request.json
    if 'latitude' in data and 'longitude' in data:
        latitude = data['latitude']
        longitude = data['longitude']
        print(f"Received location: Latitude = {latitude}, Longitude = {longitude}")

        # Example: Process location data
        processed_data = {
            "message": f"Processed location at Latitude {latitude}, Longitude {longitude}"
        }

        # Respond with processed data
        return jsonify({"status": "success", "data": processed_data}), 200
    else:
        return jsonify({"status": "error", "message": "Invalid data"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
