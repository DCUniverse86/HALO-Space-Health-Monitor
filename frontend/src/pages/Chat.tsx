
import { useState } from 'react'
import { Send, Stethoscope } from 'lucide-react'
import type { RobotPose } from '../components/HALORobot'
import HALORobot from '../components/HALORobot'
import type { Severity } from '../types/api'

// One message in HALO's demonstration conversation.
export interface ChatMessage {
    id: number
    sender: 'astronaut' | 'halo'
    text: string
}

// Props for opening the medical escalation workflow.
interface ChatProps {
    messages: ChatMessage[]
    onSendMessage: (message: string) => void
    onContactMedicalOfficer: () => void
    astronautId: string
    selectedDay: number
    assistantLoading: boolean
    aiStatus: 'online' | 'offline' | 'unknown'
}

// Displays HALO's Care Chat interface.
function Chat({
    messages,
    onSendMessage,
    onContactMedicalOfficer,
    astronautId,
    selectedDay,
    assistantLoading,
    aiStatus,
}: ChatProps) {
    const [messageInput, setMessageInput] = useState('')
    const [robotPose, setRobotPose] = useState<RobotPose>('waving')
    const [robotSeverity, setRobotSeverity] = useState<Severity | undefined>(undefined)

    // Send a demonstration message through App.tsx.
    const sendMessage = () => {
        const text = messageInput.trim()

        if (!text) {
            return
        }

        onSendMessage(text)
        setMessageInput('')
        setRobotPose('standing')
        setRobotSeverity(undefined)
    }

    return (
        <main className="mx-auto flex w-full max-w-5xl flex-col pb-24 text-white">
            {/* HALO Care Chat heading */}
            <header className="mb-5">
                <h1 className="text-3xl font-bold">
                    Care Chat
                </h1>

                <p className="mt-2 text-sm italic text-[#A8BDD6]">
                    {astronautId.charAt(0).toUpperCase() + astronautId.slice(1)}
                    {' · '}Mission Day {selectedDay}    
                </p>
            </header>

            {/* HALO robot and introductory information */}
            <section className="mb-5 flex items-center gap-4 rounded-2xl bg-linear-to-br from-[#24538B] to-[#173A6B] p-4 shadow-lg">
                <HALORobot
                    pose={robotPose}
                    severity={robotSeverity}
                    className="h-40 w-28 shrink-0 sm:h-52 sm:w-44 lg:h-60 lg:w-52"
                />

                <div className="min-w-0">
                    <h2 className="text-xl font-semibold">
                        HALO Assistant
                    </h2>

                    <p className="mt-1 text-sm text-[#C4D4E6]">
                        Your onboard health-support assistant.
                    </p>

                    <p className="mt-2 text-xs text-[#F0B429]">
                        {aiStatus === 'online'
                            ? 'Gemini AI response verified'
                            : aiStatus === 'offline'
                                ? 'Offline rules assistant active'
                                : 'Assistant mode not yet verified'}
                    </p>
                </div>
            </section>

            {/* Conversation messages */}
            <section
                aria-label="Chat conversation"
                className="flex min-h-64 flex-col gap-4 rounded-2xl bg-linear-to-b from-[#214E85] to-[#173A6B] p-4 shadow-lg sm:p-6"
            >
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${
                            message.sender === 'astronaut'
                                ? 'justify-end'
                                : 'justify-start'
                        }`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] sm:text-base ${
                                message.sender === 'astronaut'
                                    ? 'bg-[#F0B429] text-[#102B4C]'
                                    : 'bg-[#102B4C] text-white'
                            }`}
                        >
                            {message.text}
                        </div>
                    </div>
                ))}
            </section>

            {/* Message input */}
            <form
                className="mt-4 flex items-center gap-3"
                onSubmit={(event) => {
                    event.preventDefault()
                    sendMessage()
                }}
            >
                <label htmlFor="chatMessage" className="sr-only">
                    Message HALO
                </label>

                <input
                    id="chatMessage"
                    type="text"
                    value={messageInput}
                    disabled={assistantLoading}
                    onChange={(event) =>
                        setMessageInput(event.target.value)
                    }
                    placeholder="Type your message..."
                    className="min-w-0 flex-1 rounded-xl border border-[#7199C3] bg-[#102B4C] px-4 py-3 text-white placeholder:text-[#A8BDD6] focus:border-[#F0B429] focus:outline-none"
                />

                <button
                    type="submit"
                    disabled={!messageInput.trim() || assistantLoading}
                    aria-label="Send message"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0B429] text-[#102B4C] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Send size={20} aria-hidden="true" />
                </button>
            </form>

            {/* Open the existing medical escalation page. */}
            <button
                type="button"
                onClick={onContactMedicalOfficer}
                className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-[#F0B429] bg-[#1F4A85] px-5 py-4 font-semibold text-white transition-colors hover:bg-[#28598D]"
            >
                <Stethoscope
                    size={20}
                    className="text-[#F0B429]"
                    aria-hidden="true"
                />

                Contact Crew Medical Officer
            </button>

            <p className="mt-5 text-center text-xs italic text-[#A8BDD6]">
                Messages are sent to HALO's backend assistant and
                retained in this browser session. Gemini is used
                when available; otherwise, HALO may use its
                offline rules fallback. Chat messages are not
                automatically transmitted to a medical professional.
            </p>

            <p className="mt-2 text-center text-xs italic text-[#A8BDD6]">
                HALO is a decision-support research prototype,
                not a certified medical device.
            </p>
        </main>
    )
}

export default Chat
