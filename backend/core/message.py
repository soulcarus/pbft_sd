class Message:
    def __init__(self, msg_type, value, from_node):
        self.type = msg_type
        self.value = value
        self.from_node = from_node