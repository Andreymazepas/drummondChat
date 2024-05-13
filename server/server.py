from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from pymongo import MongoClient
from bson import ObjectId
import bcrypt

app = Flask(__name__)
client = MongoClient("mongodb://localhost:27017")
db = client['drummond']
users_collection  = db['users']

app.config['JWT_SECRET_KEY'] = 'your_secret_key'
jwt = JWTManager(app)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    user = {
        'name': data['name'],
        'email': data['email'],
        'password': hashed_password,
        'isAdmin': data['isAdmin'],
        'phone': data['phone']
    }
    users_collection.insert_one(user)
    return jsonify({'message': 'User registered successfully'}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users_collection.find_one({'email': data['email']})
    if user and bcrypt.checkpw(data['password'].encode('utf-8'), user['password']):
        access_token = create_access_token(identity=str(user['_id']), isAdmin=user['isAdmin'])
        return jsonify({'message': 'Login successful', 'access_token': access_token}), 200
    else:
        return jsonify({'message': 'Invalid credentials'}), 401
    

@app.route('/users/<user_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def modify_or_delete_user(user_id):
    current_user = get_jwt_identity()
    current_user_info = users_collection.find_one({'_id': ObjectId(current_user)})
    if not current_user_info:
        return jsonify({'message': 'User not found'}), 404
    
    if not current_user_info['isAdmin']:
        return jsonify({'message': 'Unauthorized. Admin privileges required'}), 401

    if request.method == 'PUT':
        data = request.get_json()
        if data.get('isAdmin') is not None:
            users_collection.update_one({'_id': ObjectId(user_id)}, {'$set': {'isAdmin': data['isAdmin']}})
            return jsonify({'message': 'isAdmin flag updated successfully'}), 200
        else:
            return jsonify({'message': 'No isAdmin flag provided'}), 400

    elif request.method == 'DELETE':
        user_to_delete = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user_to_delete:
            return jsonify({'message': 'User not found'}), 404
        users_collection.delete_one({'_id': ObjectId(user_id)})
        return jsonify({'message': 'User deleted successfully'}), 200
    


@app.route('/training-text', methods=['GET', 'PUT'])
@jwt_required()
def training_text():
    current_user = get_jwt_identity()
    current_user_info = users_collection.find_one({'_id': ObjectId(current_user)})
    if not current_user_info:
        return jsonify({'message': 'User not found'}), 404
    
    if not current_user_info['isAdmin']:
        return jsonify({'message': 'Unauthorized. Admin privileges required'}), 401

    if request.method == 'GET':
        # Retrieve training text
        # Assuming there's only one document for training text
        training_text = db['training_text'].find_one()
        return jsonify(training_text), 200
    elif request.method == 'PUT':
        data = request.get_json()
        # Update training text
        db['training_text'].update_one({}, {'$set': {'text': data['text']}}, upsert=True)
        return jsonify({'message': 'Training text updated successfully'}), 200
    

if __name__ == '__main__':
    app.run(debug=True)