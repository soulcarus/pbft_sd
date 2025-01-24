import { Circle } from "lucide-react"

interface Node {
  id: number
  is_primary: boolean
  is_byzantine: boolean
  current_phase: string
  decided_value: number | null
}

interface NodeVisualizerProps {
  nodes: Node[]
  sendMessage: (from: number, to: number, type: string, value: number) => void
}

export default function NodeVisualizer({ nodes, sendMessage }: NodeVisualizerProps) {
  const getNodeColor = (node: Node) => {
    if (node.is_byzantine) return "text-red-500"
    if (node.is_primary) return "text-blue-500"
    return "text-green-500"
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-around">
        {nodes.map((node) => (
          <div key={node.id} className="flex flex-col items-center m-2">
            <Circle
              size={50}
              className={`${getNodeColor(node)} ${node.current_phase === "DECIDED" ? "animate-pulse" : ""}`}
            />
            <span className="mt-2">Node {node.id}</span>
            <span className="text-sm">{node.current_phase}</span>
            {node.decided_value !== null && <span className="text-sm">Value: {node.decided_value}</span>}
          </div>
        ))}
      </div>
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Node List</h3>
        <ul className="space-y-2">
          {nodes.map((node) => (
            <li key={node.id} className="flex items-center justify-between">
              <span>
                Node {node.id} ({node.is_primary ? "Primary" : "Secondary"},{" "}
                {node.is_byzantine ? "Byzantine" : "Honest"})
              </span>
              <span>{node.current_phase}</span>
              {node.decided_value !== null && <span>Value: {node.decided_value}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

