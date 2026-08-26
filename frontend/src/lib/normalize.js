/**
 * Normalizers: backend (Flask/Marshmallow, snake_case) -> frontend domain
 * shapes (camelCase, see src/types/domain.js).
 *
 * Kept centralized and explicit (one function per backend shape) rather
 * than a generic recursive key-casing pass, so each mapping stays a
 * direct, readable reflection of backend/docs/API.md -- and so nothing
 * silently "works" against a field that doesn't actually exist.
 */

function emptyProfile() {
  return {
    id: null,
    userId: null,
    firstName: null,
    lastName: null,
    bio: null,
    location: null,
    profileImageUrl: null,
    phoneNumber: null,
    isVerified: false,
    createdAt: null,
    updatedAt: null,
  }
}

export function normalizeProfile(p) {
  if (!p) return emptyProfile()
  return {
    id: p.id,
    userId: p.user_id,
    firstName: p.first_name ?? null,
    lastName: p.last_name ?? null,
    bio: p.bio ?? null,
    location: p.location ?? null,
    profileImageUrl: p.profile_image_url ?? null,
    phoneNumber: p.phone_number ?? null,
    isVerified: p.is_verified ?? false,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }
}

/** A backend User (UserSchema or UserPublicSchema) -> {user, profile}. */
export function toUserProfile(u) {
  if (!u) return null
  return {
    user: {
      id: u.id,
      username: u.username,
      email: u.email ?? null,
      role: u.role,
      isActive: u.is_active ?? true,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    },
    profile: normalizeProfile(u.profile),
  }
}

export function normalizeImage(img) {
  return {
    id: img.id,
    postId: img.post_id,
    imageUrl: img.image_url,
    createdAt: img.created_at,
  }
}

export function normalizeComment(c) {
  return {
    id: c.id,
    postId: c.post_id,
    content: c.content,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    author: toUserProfile(c.author),
  }
}

export function normalizePost(p) {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    author: toUserProfile(p.author),
    images: (p.images ?? []).map(normalizeImage),
    comments: (p.comments ?? []).map(normalizeComment),
    likeCount: p.like_count ?? 0,
    likedByMe: p.liked_by_me ?? false,
  }
}

export function normalizeMembership(m) {
  return {
    id: m.id,
    userId: m.user_id,
    communityId: m.community_id,
    joinedAt: m.joined_at,
    member: toUserProfile(m.member),
  }
}

export function normalizeCommunity(c) {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? null,
    imageUrl: c.image_url ?? null,
    createdBy: c.created_by,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    creator: toUserProfile(c.creator),
    members: (c.members ?? []).map(normalizeMembership),
    isFollowing: c.is_following ?? false,
  }
}

export function normalizeParticipant(p) {
  return {
    id: p.id,
    conversationId: p.conversation_id,
    userId: p.user_id,
    joinedAt: p.joined_at,
    participant: toUserProfile(p.participant),
  }
}

export function normalizeMessage(m) {
  return {
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    content: m.content,
    isRead: m.is_read ?? false,
    createdAt: m.created_at,
    sender: toUserProfile(m.sender),
  }
}

export function normalizeConversation(c) {
  return {
    id: c.id,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    participants: (c.participants ?? []).map(normalizeParticipant),
    messages: (c.messages ?? []).map(normalizeMessage),
  }
}
