from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS

from core.message import Message
from core.pbft_node import PBFTNode

import random

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

#DEFINE
nodes = []
NUM_NODES = 4
BYZANTINE_NODES = 1
consensus_reached = False

def initialize_nodes(num_nodes, byzantine_nodes, simulation_speed):
    global nodes, consensus_reached
    nodes = [PBFTNode(i, socketio, simulation_speed, i == 0) for i in range(num_nodes)]
    byzantine_indices = random.sample(range(num_nodes), byzantine_nodes)
    for i in byzantine_indices:
        nodes[i].make_byzantine()
    consensus_reached = False
    print(f"Nós {num_nodes} inicializados, {byzantine_nodes} são Bizantinos")

def broadcast_message(message):
    global consensus_reached
    print(f"Transmitindo mensagem: {message.type} de {message.from_node}")
    
    nodes[message.from_node].last_proposed_value = message.value
    
    for node in nodes:
        node.is_active = False
    
    nodes[message.from_node].is_active = True
    
    socketio.emit('new_message', {
        'from': message.from_node,
        'to': 'all',
        'type': message.type,
        'value': message.value
    })
    
    if consensus_reached:
        return

    responses = []
    for i, node in enumerate(nodes):
        if i != message.from_node:
            response = node.receive_message(message)
            if response:
                responses.append(response)
    
    for response in responses:
        broadcast_message(response)
    
    honest_nodes = [node for node in nodes if not node.is_byzantine]
    if all(node.current_phase == "DECIDED" for node in honest_nodes):
        consensus_value = honest_nodes[0].decided_value
        if all(node.decided_value == consensus_value for node in honest_nodes):
            consensus_reached = True
            socketio.emit('consensus_reached', {'value': consensus_value})
    
    socketio.emit('node_update', {'nodes': [node.get_state() for node in nodes]})

@app.route('/start_simulation', methods=['POST'])
def start_simulation():
    global consensus_reached
    data = request.json
    num_nodes = data.get('numNodes', NUM_NODES)
    byzantine_nodes = data.get('byzantineNodes', BYZANTINE_NODES)
    simulation_speed = data.get('simulationSpeed', 1000) / 1000  # Convert to seconds
    
    initialize_nodes(num_nodes, byzantine_nodes, simulation_speed)
    value_to_propose = random.randint(1, 100)

    print(f"Iniciando simulação com valor proposto: {value_to_propose}")

    initial_message = nodes[0].start_pbft(value_to_propose)
    if initial_message:
        broadcast_message(initial_message)
    return jsonify({"status": "Simulation started", "proposed_value": value_to_propose})

@app.route('/reset_simulation', methods=['POST'])
def reset_simulation():
    global nodes, consensus_reached
    nodes = []
    consensus_reached = False
    return jsonify({"status": "Simulation reset"})

@socketio.on('message')
def handle_message(data):
    from_node = data['from']
    to_node = data['to']
    msg_type = data['type']
    value = data['value']
    
    message = Message(msg_type, value, from_node)
    print(f"Mensagem recebida: {message.type} de {message.from_node} para {to_node}")
    
    socketio.emit('new_message', {
        'from': from_node,
        'to': to_node,
        'type': msg_type,
        'value': value
    })
    
    if consensus_reached:
        return

    if to_node == 'all':
        broadcast_message(message)
    else:
        response = nodes[to_node].receive_message(message)
        if response:
            broadcast_message(response)
    
    socketio.emit('node_update', {'nodes': [node.get_state() for node in nodes]})

@socketio.on('connect')
def handle_connect():
    print("Cliente conectado")

@socketio.on('disconnect')
def handle_disconnect():
    print("Cliente disconectado")

if __name__ == '__main__':
    socketio.run(app, debug=True)
