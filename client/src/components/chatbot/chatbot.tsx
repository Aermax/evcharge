import { useState, useEffect, useRef } from "react"
import { Send, MessageCircle } from "lucide-react"

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Hi there! I can help with EV charging station information. What would you like to know?"
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { type: "user", text: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      // Make sure the API key is properly configured
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY

      if (!apiKey) {
        throw new Error("API key is missing")
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an assistant for an EV charging station booking platform. Only answer questions related to EV station locations, slot availability, or bookings. Keep responses concise and helpful.
                    
                    If the question isn't related to EV charging, politely redirect the user. Here's the user question: ${input}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500
            }
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "API response error")
      }

      const data = await response.json()

      // Properly extract the response text from the Gemini API structure
      let botText = "Sorry, I couldn't generate a response."

      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        botText = data.candidates[0].content.parts[0].text.trim()
      }

      const botMessage = {
        type: "bot",
        text: botText
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: `Error: ${
            error.message ||
            "Could not connect to AI. Please check your API key configuration."
          }`
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-80 h-96 bg-white shadow-lg rounded-xl flex flex-col border border-gray-300">
          <div className="flex justify-between items-center p-3 bg-red-600 text-white rounded-t-xl">
            <span className="font-medium">EV Chat Assistant</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-red-700 rounded-full h-6 w-6 flex items-center justify-center"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`text-sm px-3 py-2 rounded-lg max-w-[85%] ${
                    msg.type === "user"
                      ? "bg-red-500 text-white rounded-br-none"
                      : "bg-white border border-gray-200 shadow-sm rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="text-sm px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t bg-white flex gap-2 items-center">
            <input
              type="text"
              className="flex-1 border rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about EV stations..."
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center disabled:bg-red-300"
              disabled={loading || !input.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center transition-all"
          aria-label="Open chat assistant"
        >
          <MessageCircle size={20} />
        </button>
      )}
    </div>
  )
}
