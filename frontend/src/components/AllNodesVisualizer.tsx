import { Circle, CheckCircle2, AlertTriangle } from 'lucide-react'

interface Node {
  id: number
  is_primary: boolean
  is_byzantine: boolean
  current_phase: string
  decided_value: number | null
  proposed_value: number | null
  is_active: boolean
  last_proposed_value: number | null
}

interface AllNodesVisualizerProps {
  nodes: Node[]
  consensusReached: boolean
}

export default function AllNodesVisualizer({ nodes, consensusReached }: AllNodesVisualizerProps) {
  const getNodeColor = (node: Node) => {
    if (node.is_byzantine) return "text-red-500"
    if (node.is_primary) return "text-blue-500"
    return "text-green-500"
  }

  const getPhaseIcon = (node: Node) => {
    if (node.current_phase === "DECIDED") {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />
    }
    if (node.is_byzantine && node.proposed_value !== node.last_proposed_value) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
    return null
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">All Nodes Visualization</h3>
      <div className="flex flex-wrap justify-center gap-8">
        {nodes.map((node) => (
          <div key={node.id} className={`flex flex-col items-center ${node.is_active ? 'border-2 border-yellow-400 p-2 rounded-lg' : ''}`}>
            <div className="relative">
              <Circle
                size={40}
                className={`${getNodeColor(node)} ${
                  consensusReached && node.current_phase === "DECIDED" ? "animate-pulse" : ""
                }`}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {node.proposed_value !== null ? node.proposed_value : '?'}
              </div>
              <div className="absolute -top-1 -right-1">
                {getPhaseIcon(node)}
              </div>
            </div>
            <span className="mt-1 text-sm font-medium">Node {node.id}</span>
            <span className="text-xs">{node.current_phase}</span>
            {node.decided_value !== null && (
              <span className="text-xs">Value: {node.decided_value}</span>
            )}
            {node.is_byzantine && node.last_proposed_value !== null && node.last_proposed_value !== node.proposed_value && (
              <span className="text-xs text-red-500">Last: {node.last_proposed_value}</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Phases: IDLE → PRE-PREPARE → PREPARE → COMMIT → DECIDED</p>
        <div className="mt-2">
          <span className="inline-block mr-4">🔵 Primary Node</span>
          <span className="inline-block mr-4">🟢 Honest Node</span>
          <span className="inline-block mr-4">🔴 Byzantine Node</span>
          <span className="inline-block">🚨 Inconsistent Byzantine Behavior</span>
        </div>
      </div>
      {consensusReached && (
        <div className="mt-4 text-green-600 font-semibold">Consensus Reached! Simulation Complete.</div>
      )}
    </div>
  )
}
