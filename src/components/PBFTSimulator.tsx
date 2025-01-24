"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/hooks/use-toast"
import { CheckCircle2 } from "lucide-react"
import NodeVisualizer from "./NodeVisualizer"
import AllNodesVisualizer from "./AllNodesVisualizer"
import MessageLog from "./MessageLog"
import io from "socket.io-client"

const socket = io("http://localhost:5000")

export default function PBFTSimulator() {
  const [nodes, setNodes] = useState([])
  const [allNodes, setAllNodes] = useState([])
  const [numNodes, setNumNodes] = useState(4)
  const [byzantineNodes, setByzantineNodes] = useState(1)
  const [simulationSpeed, setSimulationSpeed] = useState(1000)
  const [messages, setMessages] = useState([])
  const [proposedValue, setProposedValue] = useState(null)
  const [isSimulationRunning, setIsSimulationRunning] = useState(false)
  const [consensusReached, setConsensusReached] = useState(false)
  const [consensusValue, setConsensusValue] = useState(null)

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server")
    })

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error)
      toast({
        title: "Connection Error",
        description: "Failed to connect to the server. Please try again.",
        variant: "destructive",
      })
    })

    socket.on("node_update", (data) => {
      console.log("Received node update:", data)
      setNodes(data.nodes)
      setAllNodes((prev) => {
        const newNodes = [...prev]
        data.nodes.forEach((updatedNode) => {
          const index = newNodes.findIndex((n) => n.id === updatedNode.id)
          if (index !== -1) {
            newNodes[index] = updatedNode
          } else {
            newNodes.push(updatedNode)
          }
        })
        return newNodes
      })
    })

    socket.on("new_message", (data) => {
      console.log("Received new message:", data)
      setMessages((prevMessages) => [...prevMessages, data])
    })

    socket.on("consensus_reached", (data) => {
      setConsensusReached(true)
      setConsensusValue(data.value)
      setIsSimulationRunning(false)
      toast({
        title: "Consensus Reached! 🎉",
        description: `All honest nodes have agreed on value: ${data.value}`,
      })
    })

    return () => {
      socket.off("connect")
      socket.off("connect_error")
      socket.off("node_update")
      socket.off("new_message")
      socket.off("consensus_reached")
    }
  }, [])

  const startSimulation = async () => {
    try {
      setConsensusReached(false)
      setConsensusValue(null)
      const response = await fetch("http://localhost:5000/start_simulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ numNodes, byzantineNodes, simulationSpeed }),
      })
      if (!response.ok) {
        throw new Error("Failed to start simulation")
      }
      const data = await response.json()
      console.log("Simulation started:", data)
      setProposedValue(data.proposed_value)
      setAllNodes(
        Array.from({ length: numNodes }, (_, i) => ({
          id: i,
          is_primary: i === 0,
          is_byzantine: i < byzantineNodes,
          current_phase: "IDLE",
          decided_value: null,
        })),
      )
      setIsSimulationRunning(true)
      //setMessages([])  Removed as per update 2
    } catch (error) {
      console.error("Error starting simulation:", error)
      toast({
        title: "Error",
        description: "Failed to start the simulation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetSimulation = async () => {
    try {
      const response = await fetch("http://localhost:5000/reset_simulation", {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to reset simulation")
      }
      setNodes([])
      setAllNodes([])
      setProposedValue(null)
      setIsSimulationRunning(false)
      setConsensusReached(false)
      setConsensusValue(null)
      setMessages([]) // Added as per update 3
    } catch (error) {
      console.error("Error resetting simulation:", error)
      toast({
        title: "Error",
        description: "Failed to reset the simulation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  const sendMessage = (from, to, type, value) => {
    socket.emit("message", { from, to, type, value })
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Number of Nodes</label>
          <Slider
            value={[numNodes]}
            onValueChange={(value) => setNumNodes(value[0])}
            max={10}
            step={1}
            className="w-64"
            disabled={isSimulationRunning}
          />
          <span>{numNodes}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Byzantine Nodes</label>
          <Slider
            value={[byzantineNodes]}
            onValueChange={(value) => setByzantineNodes(value[0])}
            max={Math.floor(numNodes / 3)}
            step={1}
            className="w-64"
            disabled={isSimulationRunning}
          />
          <span>{byzantineNodes}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Simulation Speed (ms)</label>
          <Slider
            value={[simulationSpeed]}
            onValueChange={(value) => setSimulationSpeed(value[0])}
            min={100}
            max={5000}
            step={100}
            className="w-64"
          />
          <span>{simulationSpeed}ms</span>
        </div>
      </div>
      <div className="flex space-x-4">
        <Button onClick={startSimulation} disabled={isSimulationRunning}>
          Start Simulation
        </Button>
        <Button onClick={resetSimulation} variant="outline">
          Reset Simulation
        </Button>
        <Button onClick={clearMessages} variant="outline">
          Clear Messages
        </Button>
      </div>
      {proposedValue !== null && (
        <div className="mt-4 flex items-center gap-2">
          <p>Proposed value: {proposedValue}</p>
          {consensusReached && (
            <div className="flex items-center text-green-600">
              <CheckCircle2 className="w-5 h-5 mr-1" />
              <span>Consensus Reached! Value: {consensusValue}</span>
            </div>
          )}
        </div>
      )}
      <div className="mt-8">
        <NodeVisualizer nodes={nodes} sendMessage={sendMessage} />
      </div>
      <div className="mt-8">
        <AllNodesVisualizer nodes={allNodes} consensusReached={consensusReached} />
      </div>
      <div className="mt-8">
        <MessageLog messages={messages} />
      </div>
    </div>
  )
}

