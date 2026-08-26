/**
 * MOCK API — simulated network layer for visual development only.
 * Mirrors the real service contracts so swapping to the real backend is
 * a one-line change in each service.
 */

import { comments, communities as seedCommunities, communityFollows as seedCommunityFollows, conversations as seedConversations, currentUserId, db, likes, messages as seedMessages, posts, users } from './mockDb'

const LATENCY_MS = 350

function delay(value, ms = LATENCY_MS) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function fail(message, status = 400) {
  throw { status, message }
}

function postDetail(post, viewerId) {
  const postLikes = likes.filter((l) => l.postId === post.id)
  return {
    ...post,
    likeCount: postLikes.length,
    likedByMe: postLikes.some((l) => l.userId === viewerId),
    comments: comments.filter((c) => c.postId === post.id),
  }
}

function toProfile(u) {
  const { profile, ...user } = u
  return { user, profile }
}

export const mockAuth = {
  async login(usernameOrEmail, password) {
    if (!usernameOrEmail || !password) {
      fail('Please enter your username and password.')
    }
    const user = users.find(
      (u) => u.username === usernameOrEmail || u.email === usernameOrEmail,
    )
    if (!user || password.length < 4) {
      fail('Invalid username or password.', 401)
    }
    return delay({
      accessToken: `mock-token-${user.id}`,
      user: toProfile(user),
    })
  },

  async register(input) {
    if (!input.username || !input.email || input.password.length < 4) {
      fail('Please complete all fields (password at least 4 characters).')
    }
    if (users.some((u) => u.username === input.username || u.email === input.email)) {
      fail('A user with that username or email already exists.')
    }
    const id = Math.max(...users.map((u) => u.id)) + 1
    const created = {
      id,
      username: input.username,
      email: input.email,
      role: 'farmer',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        id,
        userId: id,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        bio: null,
        location: null,
        profileImageUrl: null,
        phoneNumber: null,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
    users.push(created)
    return delay({ accessToken: `mock-token-${id}`, user: toProfile(created) })
  },
}

export const mockProfiles = {
  async getProfile(userId) {
    const user = users.find((u) => u.id === userId)
    if (!user) fail('Profile not found.', 404)
    return delay(toProfile(user))
  },

  async updateProfile(userId, input) {
    const user = users.find((u) => u.id === userId)
    if (!user) fail('Profile not found.', 404)
    user.profile = { ...user.profile, ...input, updatedAt: new Date().toISOString() }
    return delay(toProfile(user))
  },

  async myProfile(userId) {
    return mockProfiles.getProfile(userId)
  },
}

export const mockPosts = {
  async listPosts(page = 1, pageSize = 10) {
    const viewer = currentUserId
    const items = posts
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((p) => postDetail(p, viewer))
    const start = (page - 1) * pageSize
    return delay({
      items: items.slice(start, start + pageSize),
      page,
      pageSize,
      total: items.length,
    })
  },

  async getPost(id) {
    const post = posts.find((p) => p.id === id)
    if (!post) fail('Post not found.', 404)
    return delay(postDetail(post, currentUserId))
  },

  async listUserPosts(userId) {
    const viewer = currentUserId
    const items = posts
      .filter((p) => p.author.user.id === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((p) => postDetail(p, viewer))
    return delay(items)
  },

  async createPost(input) {
    if (!input.title.trim() || !input.content.trim()) {
      fail('Please provide both a title and content.')
    }
    const id = Math.max(...posts.map((p) => p.id), 0) + 1
    const author = users.find((u) => u.id === currentUserId)
    if (!author) fail('Not authenticated.', 401)
    const post = {
      id,
      author: toProfile(author),
      title: input.title.trim(),
      content: input.content.trim(),
      images: input.imageUrls.map((url, i) => ({
        id: id * 100 + i,
        postId: id,
        imageUrl: url,
        createdAt: new Date().toISOString(),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    posts.unshift(post)
    return delay(postDetail(post, currentUserId))
  },

  async toggleLike(postId) {
    const existing = likes.find((l) => l.userId === currentUserId && l.postId === postId)
    if (existing) {
      likes.splice(likes.indexOf(existing), 1)
    } else {
      likes.push({
        id: Math.max(...likes.map((l) => l.id), 0) + 1,
        userId: currentUserId,
        postId,
        createdAt: new Date().toISOString(),
      })
    }
    const count = likes.filter((l) => l.postId === postId).length
    return delay({ likedByMe: !existing, likeCount: count })
  },

  async addComment(postId, content) {
    if (!content.trim()) fail('Please enter a comment.')
    const author = users.find((u) => u.id === currentUserId)
    if (!author) fail('Not authenticated.', 401)
    const comment = {
      id: Math.max(...comments.map((c) => c.id), 0) + 1,
      postId,
      author: toProfile(author),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    comments.push(comment)
    return delay(comment)
  },
}

export const mockExperts = {
  async listExperts(page = 1, pageSize = 20) {
    const experts = users.filter((u) => u.role === 'expert').map(toProfile)
    const start = (page - 1) * pageSize
    return delay({
      items: experts.slice(start, start + pageSize),
      page,
      pageSize,
      total: experts.length,
    })
  },

  async getExpert(userId) {
    const user = users.find((u) => u.id === userId && u.role === 'expert')
    if (!user) fail('Expert not found.', 404)
    return delay(toProfile(user))
  },

  async getMyFollowing() {
    const followingIds = db().follows
      .filter((f) => f.followerId === currentUserId)
      .map((f) => f.followingId)
    return delay({ followingIds })
  },

  async getFollowersCount(userId) {
    const followersCount = db().follows.filter((f) => f.followingId === userId).length
    return delay(followersCount)
  },

  async getFollowSummary(userId) {
    const followingIds = db().follows
      .filter((f) => f.followerId === currentUserId)
      .map((f) => f.followingId)
    const followersCount = db().follows.filter((f) => f.followingId === userId).length
    return delay({
      followingCount: followingIds.length,
      followersCount,
      followingIds,
    })
  },

  async toggleFollow(userId) {
    const follows = db().follows
    const existing = follows.find(
      (f) => f.followerId === currentUserId && f.followingId === userId,
    )
    if (existing) {
      follows.splice(follows.indexOf(existing), 1)
    } else {
      follows.push({ followerId: currentUserId, followingId: userId })
    }
    const followingIds = follows
      .filter((f) => f.followerId === currentUserId)
      .map((f) => f.followingId)
    return delay({
      followingCount: followingIds.length,
      followersCount: follows.filter((f) => f.followingId === userId).length,
      followingIds,
    })
  },
}

export const mockSession = {
  async me(userId) {
    return mockProfiles.getProfile(userId)
  },
}

export const mockCommunities = {
  async listCommunities() {
    return delay(seedCommunities.map((c) => ({
      ...c,
      memberCount: c.members.length,
    })))
  },

  async getCommunity(communityId) {
    const community = seedCommunities.find((c) => c.id === communityId)
    if (!community) fail('Community not found.', 404)
    return delay({ ...community, memberCount: community.members.length })
  },

  async createCommunity(input) {
    if (!input.name?.trim()) fail('Community name is required.')
    const id = Math.max(...seedCommunities.map((c) => c.id), 0) + 1
    const community = {
      id,
      name: input.name.trim(),
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      createdBy: currentUserId,
      members: [{ id, userId: currentUserId, communityId: id, joinedAt: new Date().toISOString() }],
      isMember: true,
      isFollowing: true,
      memberCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    seedCommunities.push(community)
    return delay(community)
  },

  async toggleMembership(communityId) {
    const community = seedCommunities.find((c) => c.id === communityId)
    if (!community) fail('Community not found.', 404)
    const idx = community.members.findIndex((m) => m.userId === currentUserId)
    if (idx >= 0) {
      community.members.splice(idx, 1)
    } else {
      community.members.push({ id: Date.now(), userId: currentUserId, communityId, joinedAt: new Date().toISOString() })
    }
    return delay({
      isMember: idx < 0,
      memberCount: community.members.length,
    })
  },

  async toggleCommunityFollow(communityId) {
    const existing = seedCommunityFollows.findIndex(
      (f) => f.userId === currentUserId && f.communityId === communityId
    )
    if (existing >= 0) {
      seedCommunityFollows.splice(existing, 1)
    } else {
      seedCommunityFollows.push({ userId: currentUserId, communityId })
    }
    return delay({ isFollowing: existing < 0 })
  },
}

export const mockMessaging = {
  async listConversations() {
    const convs = seedConversations.filter((c) =>
      c.participants.some((p) => p.userId === currentUserId)
    )
    return delay(convs.map((c) => {
      const allMsgs = seedMessages.filter((m) => m.conversationId === c.id)
      const lastMsg = allMsgs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
      return {
        ...c,
        lastMessage: lastMsg ? {
          ...lastMsg,
          sender: toProfile(users.find((u) => u.id === lastMsg.senderId)),
        } : null,
        participants: c.participants.map((p) => ({
          ...p,
          participant: toProfile(users.find((u) => u.id === p.userId)),
        })),
      }
    }))
  },

  async createConversation(input) {
    const targetUserId = input.participantId
    if (!targetUserId) fail('participant_id is required.')
    if (targetUserId === currentUserId) fail('Cannot create conversation with yourself.', 400)

    const existing = seedConversations.find((c) =>
      c.communityId === null &&
      c.createdBy === currentUserId &&
      c.participants.some((p) => p.userId === targetUserId)
    )
    if (existing) {
      return delay(existing)
    }

    const id = Math.max(...seedConversations.map((c) => c.id), 0) + 1
    const conv = {
      id,
      communityId: null,
      createdBy: currentUserId,
      participants: [
        { id: Date.now(), conversationId: id, userId: currentUserId, joinedAt: new Date().toISOString() },
        { id: Date.now() + 1, conversationId: id, userId: targetUserId, joinedAt: new Date().toISOString() },
      ],
      lastMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    seedConversations.push(conv)
    return delay(conv)
  },

  async listMessages(conversationId) {
    return delay(
      seedMessages
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map((m) => ({
          ...m,
          sender: toProfile(users.find((u) => u.id === m.senderId)),
        }))
    )
  },

  async sendMessage(conversationId, content) {
    if (!content.trim()) fail('Message content is required.')
    const msg = {
      id: Math.max(...seedMessages.map((m) => m.id), 0) + 1,
      conversationId,
      senderId: currentUserId,
      sender: toProfile(users.find((u) => u.id === currentUserId)),
      content: content.trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
    }
    seedMessages.push(msg)
    return delay(msg)
  },
}