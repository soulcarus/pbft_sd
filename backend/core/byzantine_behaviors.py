from core.message import Message
import random
from time import sleep

def ignore_message(node, message):
    print(f"Nó {node.id} (Bizantino) ignorou a mensagem")
    return None

def send_incorrect_message(node, message):
    incorrect_value = message.value + random.randint(1, 10)
    print(f"Nó {node.id} (Bizantino) enviou uma mensagem incorreta")
    node.proposed_value = incorrect_value
    return node.broadcast_message(Message(message.type, incorrect_value, node.id))

def delay_message(node, message):
    print(f"Nó {node.id} (Bizantino) atrasou a mensagem")
    sleep(node.simulation_speed * 2)  # Double the delay
    return normal_behavior(node, message)

def normal_behavior(node, message):
    print(f"Nó {node.id} (Bizantino) comportou-se normalmente")
    return node.receive_message(message)