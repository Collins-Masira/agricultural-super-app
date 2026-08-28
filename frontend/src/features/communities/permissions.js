export function canPostInCommunity(community, userRole) {
  if (!community.myRole) return false
  if (community.myRole === 'admin') return true
  if (community.postingPermission === 'admins_only') return false
  if (community.postingPermission === 'experts_only') return userRole === 'expert'
  return true
}

export function canCommentInCommunity(community, userRole) {
  if (!community.commentsEnabled) return false
  if (!community.myRole) return false
  if (community.myRole === 'admin') return true
  if (community.messagingPermission === 'admins_only') return false
  if (community.messagingPermission === 'experts_only') return userRole === 'expert'
  return true
}
