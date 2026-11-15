// Defines the four main HALO navigation destinations.
export type NavPage = 'home' | 'vitals' | 'trends' | 'chat' | 'profile' | 'checkin' | 'escalation'
// Icons for HALO's main navigation tabs
import { House, HeartPulse, ChartNoAxesCombined, MessageCircle, UserRound } from "lucide-react"
import type { LucideIcon } from "lucide-react"

// Defines the active tab and the function used to switch pages
interface BottomNavProps {
    activePage: NavPage
    onNavigate: (page: NavPage) => void
}

// Defines the navigation tabs and their display labels
const navItems: {page: NavPage; label: string; icon: LucideIcon}[] = [
    {page: 'home', label: 'Home', icon: House},
    {page: 'vitals', label: 'Vitals', icon: HeartPulse},
    {page: 'trends', label: 'Trends', icon: ChartNoAxesCombined},
    {page: 'chat', label: 'Chat', icon: MessageCircle},
    {page: 'profile', label: 'Profile', icon: UserRound},
]
// Displays HALO's bottom navigation bar.
function BottomNav({ activePage, onNavigate }: BottomNavProps) {
    return (
        <nav className="fixed bottom-0 left-0 z-50 grid w-full grid-cols-5 bg-[#102B4C] p-4" aria-label= "Main navigation">
            {navItems.map((item) => {
                const Icon = item.icon

                return (
                <button 
                    key={item.page}
                    type="button"
                    onClick={() => onNavigate(item.page)}
                    aria-current={activePage === item.page ? 'page' : undefined}
                    className= {`flex flex-col items-center justify-center gap-1 text-center ${
                        activePage === item.page
                            ? 'text-[#F0B429]'
                            : 'text-[#A8BDD6]'
                    }`}
                >
                    <Icon size={24} aria-hidden="true"/>
                    <p>{item.label}</p>
               </button>
            )
        })}
        </nav>
    )
}

export default BottomNav