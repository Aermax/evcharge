import { useState } from "react"
import { Send, MessageCircle } from "lucide-react"

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<
    { type: "user" | "bot"; text: string }[]
  >([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMessage: { type: "user"; text: string } = {
      type: "user",
      text: input
    } // Define as 'user'

    setMessages((prevMessages) => [...prevMessages, userMessage]) // Add the user message to state
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      })
      const data = await res.json()
      const botMessage: { type: "bot"; text: string } = {
        type: "bot",
        text: data.response
      } // Define as 'bot'
      setMessages((prevMessages) => [...prevMessages, botMessage]) // Add the bot message to state
    } catch (err) {
      const errorMessage: { type: "bot"; text: string } = {
        type: "bot",
        text: "Error: Could not get response."
      }
      setMessages((prevMessages) => [...prevMessages, errorMessage]) // Add error message to state
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-80 h-96 bg-white shadow-lg rounded-xl flex flex-col border border-gray-300">
          <div className="flex justify-between items-center p-3 bg-red-600 text-white rounded-t-xl">
            <span>Chat Assistant</span>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`text-sm px-2 py-1 rounded ${
                  msg.type === "user"
                    ? "bg-red-200 self-end text-right"
                    : "bg-white border self-start"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="p-2 border-t bg-white flex gap-2">
            <input
              type="text"
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask something..."
            />
            <button onClick={sendMessage} className="text-red-600">
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-600 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center"
        >
          <MessageCircle />
        </button>
      )}
    </div>
  )
}
