import { useEffect, useRef } from "react"

export default function MessageLog({ messages }) {
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Message Log</h3>
      <div ref={logRef} className="bg-gray-100 p-4 rounded-md h-60 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet.</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="mb-1">
              <span className="font-medium">
                Node {msg.from} → {msg.to === "all" ? "All" : `Node ${msg.to}`}:
              </span>{" "}
              {msg.type} ({msg.value})
            </div>
          ))
        )}
      </div>
    </div>
  )
}

