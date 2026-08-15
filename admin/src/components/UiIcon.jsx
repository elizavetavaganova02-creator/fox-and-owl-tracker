const paths = {
  today: <><path d="M4 11a8 8 0 1 0 16 0"/><path d="M12 3v8l4 2"/></>,
  students: <><path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  lessons: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 7h8M8 11h6"/></>,
  payments: <><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/></>,
  coins: <><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></>,
  statistics: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-5"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></>,
  income: <><circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.5-1.6-.8-2.6-.8-1.4 0-2.4.7-2.4 1.8 0 2.8 5.5 1.2 5.5 4.2 0 1.2-1.1 2.2-2.8 2.2-1.1 0-2.2-.3-3-.9M12.5 5.7v12.5"/></>,
  close: <path d="M6 6l12 12M18 6 6 18"/>,
  warning: <><path d="M10.3 3.4 2.2 18a2 2 0 0 0 1.8 3h16a2 2 0 0 0 1.8-3L13.7 3.4a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
}

export function UiIcon({ name, size = 20, className = '' }) {
  return <svg aria-hidden="true" className={className} fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{paths[name] || paths.today}</svg>
}

export function CoinIcon({ size = 22 }) {
  return <svg aria-hidden="true" className="coin-icon" height={size} viewBox="0 0 32 32" width={size}><defs><linearGradient id="coinGold" x1="5" y1="4" x2="27" y2="28"><stop stopColor="#FFE59A"/><stop offset=".5" stopColor="#F4B83F"/><stop offset="1" stopColor="#D98A1E"/></linearGradient></defs><circle cx="16" cy="16" r="13" fill="url(#coinGold)" stroke="#C97B17" strokeWidth="1.5"/><circle cx="16" cy="16" r="9.5" fill="none" stroke="#FFF0B5" strokeWidth="1.4" opacity=".8"/><path d="M18.8 11.6c-.8-.6-1.7-.9-2.8-.9-1.5 0-2.6.8-2.6 2 0 3 5.8 1.3 5.8 4.6 0 1.3-1.2 2.3-3 2.3-1.2 0-2.3-.4-3.2-1M16.2 8.8v14" fill="none" stroke="#9B5A0C" strokeLinecap="round" strokeWidth="1.6"/><path d="M9 8.5c2.2-2.5 5.8-3.5 9-2.4" fill="none" stroke="white" strokeLinecap="round" strokeWidth="2" opacity=".75"/></svg>
}

export function BrandMark({ compact = false }) {
  return <svg aria-hidden="true" className={compact ? 'brand-illustration brand-illustration--compact' : 'brand-illustration'} viewBox="0 0 96 64"><ellipse cx="31" cy="34" rx="22" ry="22" fill="#F28A51"/><path d="M12 24 16 5l15 14M50 24 46 5 31 19" fill="#D86732"/><path d="M20 38c6 9 16 9 22 0-4 2-7 1-11-2-4 3-7 4-11 2Z" fill="#FFF6EA"/><circle cx="24" cy="30" r="2.3" fill="#263744"/><circle cx="38" cy="30" r="2.3" fill="#263744"/><path d="m28 35 3 2 3-2" fill="#56382E"/><ellipse cx="67" cy="34" rx="20" ry="22" fill="#7EA8B5"/><path d="m49 20 8-13 4 15M85 20 77 7l-4 15" fill="#567D8D"/><circle cx="60" cy="31" r="7" fill="#FFF8EC"/><circle cx="74" cy="31" r="7" fill="#FFF8EC"/><circle cx="61" cy="31" r="2.3" fill="#263744"/><circle cx="73" cy="31" r="2.3" fill="#263744"/><path d="m67 34-4 4h8Z" fill="#E9A443"/><path d="M54 49c8 5 18 5 26 0" fill="none" stroke="#466D7C" strokeLinecap="round" strokeWidth="2"/></svg>
}

const avatarColors = { fox:'#F28A51', owl:'#7EA8B5', panda:'#6F7780', rabbit:'#C6A7D7', cat:'#E8A35F', dog:'#B98B68', penguin:'#58798B', bear:'#A77B5A', hedgehog:'#A98265', raccoon:'#798894', elephant:'#8AA8BA', tiger:'#E48A3F' }
export function AnimalAvatar({ id = 'fox' }) {
  const color = avatarColors[id] || avatarColors.fox
  return <svg aria-hidden="true" className="animal-avatar" viewBox="0 0 56 56"><circle cx="28" cy="29" r="20" fill={color}/><path d="m12 21 4-13 10 9M44 21 40 8l-10 9" fill={color}/><ellipse cx="21" cy="27" rx="5" ry="6" fill="#FFF9EF" opacity=".9"/><ellipse cx="35" cy="27" rx="5" ry="6" fill="#FFF9EF" opacity=".9"/><circle cx="22" cy="28" r="1.8" fill="#25343E"/><circle cx="34" cy="28" r="1.8" fill="#25343E"/><path d="m25 35 3 2.5 3-2.5M22 42c4 2 8 2 12 0" fill="none" stroke="#4E382F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6"/></svg>
}
