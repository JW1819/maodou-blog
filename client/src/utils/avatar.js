const AVATAR_COLORS = [
  '#2d6a4f', '#40916c', '#52b788', '#74c69d',
  '#1b4332', '#8d99ae', '#2b2d42', '#6c757d',
  '#e76f51', '#f4a261', '#e9c46a', '#264653',
]

export function avatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function avatarLetter(name) {
  return (name || '?').charAt(0).toUpperCase()
}
