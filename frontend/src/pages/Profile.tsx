import { useState } from 'react'
import { Bell, ChevronRight, Clock3, LockKeyhole } from 'lucide-react'

type Setting = 'reminders' | 'units' | 'privacy'

const cardClass = 'rounded-[20px] bg-linear-to-br from-[#28598D] to-[#173A66] p-4 shadow-lg sm:p-5'

// Demo profile matching HALO Application (11).png.
// Settings are informational until the backend supports profile preferences.
function Profile() {
    const [openSetting, setOpenSetting] = useState<Setting | null>(null)

    const toggleSetting = (setting: Setting) => {
        setOpenSetting((current) => current === setting ? null : setting)
    }

    return (
        <main className="mx-auto w-full max-w-6xl px-2 pb-28 text-white sm:px-4 lg:px-6">
            <header className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Profile</h1>
                <span className="tracking-[0.28em] text-[#C1D2E7]">HALO</span>
            </header>

            <div className="mt-6 flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
                {/* CSS illustration stands in for the original HALO robot artwork. */}
                <div aria-label="HALO robot avatar" role="img" className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-[#7199C3] bg-[#E4EDF7] shadow-[0_0_0_3px_#102B4C] sm:h-28 sm:w-28">
                    <div className="relative h-14 w-[74px] rounded-[28px] border-[5px] border-[#527CA7] bg-[#102B4C] sm:h-16 sm:w-[84px]">
                        <span className="absolute left-4 top-4 h-2 w-2 rounded-full bg-[#F0B429]" />
                        <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[#F0B429]" />
                        <span className="absolute bottom-3 left-1/2 h-3 w-6 -translate-x-1/2 rounded-b-full border-b-[3px] border-[#F0B429]" />
                    </div>
                </div>
                <div className="min-w-0">
                    <p className="text-xs tracking-[0.18em] text-[#A8BDD6]">DEMO PROFILE</p>
                    <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Commander Alex</h2>
                    <p className="mt-1 text-sm italic text-[#B9C9DD] sm:text-base">Crew member · Mission day 75</p>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                <section className={cardClass} aria-labelledby="mission-details-title">
                    <h2 id="mission-details-title" className="border-b border-[#6282A6]/40 pb-2 text-xl font-bold">Mission details</h2>
                    <dl className="mt-3 space-y-2 text-sm sm:text-base">
                        <div className="flex justify-between gap-4"><dt className="text-[#C4D4E6]">Mission:</dt><dd className="text-right">Deep Space Demo</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-[#C4D4E6]">Crew ID:</dt><dd>HALO-001</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-[#C4D4E6]">Role:</dt><dd>Commander</dd></div>
                    </dl>
                </section>

                <section className={cardClass} aria-labelledby="baseline-title">
                    <h2 id="baseline-title" className="text-xl font-bold">Personal baseline</h2>
                    <p className="mt-3 text-sm sm:text-base">Resting heart rate: 62 bpm</p>
                    <p className="mt-1 text-sm sm:text-base">Usual sleep: 8 hours</p>
                    <p className="mt-1 text-xs italic text-[#C4D4E6]">Demonstration values.</p>
                </section>

                <section className={`${cardClass} md:col-span-2`} aria-labelledby="settings-title">
                    <h2 id="settings-title" className="mb-2 text-xl font-bold">Settings</h2>
                    {([
                        { id: 'reminders' as const, label: 'Reminders', icon: Bell, detail: 'Reminder preferences will be available when profile settings are connected.' },
                        { id: 'units' as const, label: 'Units and time', icon: Clock3, detail: 'Measurement units and time preferences are not configurable in this demo.' },
                        { id: 'privacy' as const, label: 'Privacy and sharing', icon: LockKeyhole, detail: 'Privacy and sharing controls will be available after backend integration.' },
                    ]).map((item) => {
                        const Icon = item.icon
                        return (
                            <div key={item.id} className="border-b border-[#6282A6]/40 last:border-b-0">
                                <button type="button" aria-expanded={openSetting === item.id}
                                    onClick={() => toggleSetting(item.id)}
                                    className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm sm:text-base">
                                    <span className="flex items-center gap-3"><Icon size={17} className="text-[#C4D4E6]" aria-hidden="true" />{item.label}</span>
                                    <ChevronRight size={18} className={`text-[#C4D4E6] transition-transform ${openSetting === item.id ? 'rotate-90' : ''}`} aria-hidden="true" />
                                </button>
                                {openSetting === item.id && <p className="pb-3 text-sm text-[#C4D4E6]">{item.detail}</p>}
                            </div>
                        )
                    })}
                </section>
            </div>

            <p className="mt-8 text-center text-xs italic text-[#B9C9DD]">Decision support prototype. Not a medical device.</p>
        </main>
    )
}

export default Profile
