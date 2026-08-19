/**
 * MOCK API — simulated network layer for visual development only.
 * Mirrors the real service contracts so swapping to the real backend is
 * a one-line change in each service.
 */

import {
  ApiError,
  AuthSession,
  Comment,
  FollowSummary,
  Paginated,
  Post,
  PostDetail,
  Profile,
  UserProfile,
} from '@/types/domain'
import { comments, currentUserId, db, likes, posts, users } from './mockDb'

const LATENCY_MS = 350

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function fail(message: string, status = 400): never {
  throw { status, message } satisfies ApiError
}

function postDetail(post: Post, viewerId: number): PostDetail {
  const postLikes = likes.filter((l) => l.postId === post.id)
  return {
    ...post,
    likeCount: postLikes.length,
    likedByMe: postLikes.some((l) => l.userId === viewerId),
    comments: comments.filter((c) => c.postId === post.id),
  }
}

function toProfile(u: (typeof users)[number]): UserProfile {
  const { profile, ...user } = u
  return { user, profile }
}

export const mockAuth = {
  async login(usernameOrEmail: string, password: string): Promise<AuthSession> {
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

  async register(input: {
    username: string
    email: string
    password: string
    firstName?: string
    lastName?: string
  }): Promise<AuthSession> {
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
      role: 'farmer' as const,
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
  async getProfile(userId: number): Promise<UserProfile> {
    const user = users.find((u) => u.id === userId)
    if (!user) fail('Profile not found.', 404)
    return delay(toProfile(user))
  },

  async updateProfile(
    userId: number,
    input: Partial<Profile>,
  ): Promise<UserProfile> {
    const user = users.find((u) => u.id === userId)
    if (!user) fail('Profile not found.', 404)
    user.profile = { ...user.profile, ...input, updatedAt: new Date().toISOString() }
    return delay(toProfile(user))
  },

  async myProfile(userId: number): Promise<UserProfile> {
    return mockProfiles.getProfile(userId)
  },
}

export const mockPosts = {
  async listPosts(page = 1, pageSize = 10): Promise<Paginated<PostDetail>> {
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

  async getPost(id: number): Promise<PostDetail> {
    const post = posts.find((p) => p.id === id)
    if (!post) fail('Post not found.', 404)
    return delay(postDetail(post, currentUserId))
  },

  async listUserPosts(userId: number): Promise<PostDetail[]> {
    const viewer = currentUserId
    const items = posts
      .filter((p) => p.author.user.id === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((p) => postDetail(p, viewer))
    return delay(items)
  },

  async createPost(input: {
    title: string
    content: string
    imageUrls: string[]
  }): Promise<PostDetail> {
    if (!input.title.trim() || !input.content.trim()) {
      fail('Please provide both a title and content.')
    }
    const id = Math.max(...posts.map((p) => p.id), 0) + 1
    const author = users.find((u) => u.id === currentUserId)
    if (!author) fail('Not authenticated.', 401)
    const post: Post = {
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

  async toggleLike(postId: number): Promise<{ likedByMe: boolean; likeCount: number }> {
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

  async addComment(postId: number, content: string): Promise<Comment> {
    if (!content.trim()) fail('Please enter a comment.')
    const author = users.find((u) => u.id === currentUserId)
    if (!author) fail('Not authenticated.', 401)
    const comment: Comment = {
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
  async listExperts(page = 1, pageSize = 20): Promise<Paginated<UserProfile>> {
    const experts = users.filter((u) => u.role === 'expert').map(toProfile)
    const start = (page - 1) * pageSize
    return delay({
      items: experts.slice(start, start + pageSize),
      page,
      pageSize,
      total: experts.length,
    })
  },

  async getExpert(userId: number): Promise<UserProfile> {
    const user = users.find((u) => u.id === userId && u.role === 'expert')
    if (!user) fail('Expert not found.', 404)
    return delay(toProfile(user))
  },

  async getMyFollowing(): Promise<{ followingIds: number[] }> {
    const followingIds = db().follows
      .filter((f) => f.followerId === currentUserId)
      .map((f) => f.followingId)
    return delay({ followingIds })
  },

  async getFollowersCount(userId: number): Promise<number> {
    const followersCount = db().follows.filter((f) => f.followingId === userId).length
    return delay(followersCount)
  },

  async getFollowSummary(userId: number): Promise<FollowSummary> {
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

  async toggleFollow(userId: number): Promise<FollowSummary> {
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
  async me(userId: number): Promise<UserProfile> {
    return mockProfiles.getProfile(userId)
  },
}