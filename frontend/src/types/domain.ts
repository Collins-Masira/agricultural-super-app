/**
 * Domain types for the Agricultural Super App frontend.
 *
 * These mirror the verified MVP data model in docs/schema.dbml so the
 * frontend and backend teams share the same vocabulary. They are a contract
 * for expected API payloads — NOT implementation of the backend.
 */

/**
 * User roles documented in the MVP data model (docs/database.md).
 * NOTE: docs/project/requirements.md lists a broader role set. The role
 * discrepancy is intentionally NOT resolved here; update once the team
 * confirms the final roles.
 */
export type UserRole = 'farmer' | 'expert' | 'admin'

export interface User {
  id: number
  username: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Profile {
  id: number
  userId: number
  firstName?: string | null
  lastName?: string | null
  bio?: string | null
  location?: string | null
  profileImageUrl?: string | null
  phoneNumber?: string | null
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

/** A user together with their profile — the shape used across the UI. */
export interface UserProfile {
  user: User
  profile: Profile
}

export interface PostImage {
  id: number
  postId: number
  imageUrl: string
  createdAt: string
}

export interface Post {
  id: number
  author: UserProfile
  title: string
  content: string
  images: PostImage[]
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: number
  postId: number
  author: UserProfile
  content: string
  createdAt: string
  updatedAt: string
}

export interface Like {
  id: number
  userId: number
  postId: number
  createdAt: string
}

/** Post detail includes the like/comment aggregate state. */
export interface PostDetail extends Post {
  likeCount: number
  likedByMe: boolean
  comments: Comment[]
}

/** Who the current user follows (user_follows). */
export interface FollowSummary {
  followingCount: number
  followersCount: number
  followingIds: number[]
}

export interface AuthSession {
  accessToken: string
  user: UserProfile
}

/** API error shape used by the service layer. */
export interface ApiError {
  status: number
  message: string
  details?: Record<string, string[]>
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}