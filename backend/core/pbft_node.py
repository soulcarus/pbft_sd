from time import sleep
import random
from core.message import Message
from core.byzantine_behaviors import *

class PBFTNode:
    def __init__(self, node_id, socketio, simulation_speed, is_primary=False):
        self.id = node_id
        self.is_primary = is_primary
        self.is_byzantine = False
        self.current_view = 0
        self.prepared_messages = {}
        self.committed_messages = {}
        self.current_phase = "IDLE"
        self.decided_value = None
        self.proposed_value = None
        self.last_proposed_value = None
        self.socketio = socketio
        self.simulation_speed = simulation_speed
        self.is_active = False

    def make_byzantine(self):
        self.is_byzantine = True

    def start_pbft(self, value):
        if self.is_primary:
            self.proposed_value = value
            return self.broadcast_preprepare(value)
        return None

    def broadcast_preprepare(self, value):
        self.current_phase = "PRE-PREPARE"
        message = Message("PRE-PREPARE", value, self.id)
        return self.broadcast_message(message)

    def receive_message(self, message):
        print(f"Nó {self.id} recebeu mensagem: {message.type} de {message.from_node}")
        self.delay()
        if self.is_byzantine:
            return self.byzantine_behavior(message)

        if message.type == "PRE-PREPARE":
            return self.handle_preprepare(message)
        elif message.type == "PREPARE":
            return self.handle_prepare(message)
        elif message.type == "COMMIT":
            return self.handle_commit(message)
        return None

    def byzantine_behavior(self, message):
        behaviors = [
            ignore_message,
            send_incorrect_message,
            delay_message,
            normal_behavior
        ]
        return random.choice(behaviors)(self, message)

    def handle_preprepare(self, message):
        self.current_phase = "PREPARE"
        self.proposed_value = message.value
        prepare_msg = Message("PREPARE", message.value, self.id)
        return self.broadcast_message(prepare_msg)

    def handle_prepare(self, message):
        if message.value not in self.prepared_messages:
            self.prepared_messages[message.value] = set()
        self.prepared_messages[message.value].add(message.from_node)
        
        if len(self.prepared_messages[message.value]) >= 2:
            self.current_phase = "COMMIT"
            commit_msg = Message("COMMIT", message.value, self.id)
            return self.broadcast_message(commit_msg)
        return None

    def handle_commit(self, message):
        if message.value not in self.committed_messages:
            self.committed_messages[message.value] = set()
        self.committed_messages[message.value].add(message.from_node)
        
        if len(self.committed_messages[message.value]) >= 2:
            self.current_phase = "DECIDED"
            self.decided_value = message.value
            return self.broadcast_message(Message("DECIDED", self.decided_value, self.id))
        return None

    def broadcast_message(self, message):
        print(f"Nó {self.id} transmitindo mensagem: {message.type}")
        self.delay()
        self.socketio.emit('new_message', {
            'from': message.from_node,
            'to': 'all',
            'type': message.type,
            'value': message.value
        })
        self.socketio.emit('node_update', {'nodes': [self.get_state()]})
        return message

    def get_state(self):
        return {
            "id": self.id,
            "is_primary": self.is_primary,
            "is_byzantine": self.is_byzantine,
            "current_phase": self.current_phase,
            "decided_value": self.decided_value,
            "proposed_value": self.proposed_value,
            "last_proposed_value": self.last_proposed_value,
            "is_active": self.is_active
        }

    def delay(self):
        sleep(self.simulation_speed)