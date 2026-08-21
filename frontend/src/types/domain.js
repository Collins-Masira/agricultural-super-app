/**
 * Domain model documentation for the Agricultural Super App frontend.
 *
 * These shapes mirror the verified MVP data model in docs/schema.dbml so the
 * frontend and backend teams share the same vocabulary. They document the
 * expected API payloads — they are NOT runtime code.
 *
 * @typedef {'farmer' | 'expert' | 'admin'} UserRole
 *   User roles documented in the MVP data model (docs/database.md).
 *   NOTE: docs/project/requirements.md lists a broader role set. The role
 *   discrepancy is intentionally NOT resolved here; update once the team
 *   confirms the final roles.
 *
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {UserRole} role
 * @property {boolean} isActive
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} Profile
 * @property {number} id
 * @property {number} userId
 * @property {?string} firstName
 * @property {?string} lastName
 * @property {?string} bio
 * @property {?string} location
 * @property {?string} profileImageUrl
 * @property {?string} phoneNumber
 * @property {boolean} isVerified
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} UserProfile  A user together with their profile.
 * @property {User} user
 * @property {Profile} profile
 *
 * @typedef {Object} PostImage
 * @property {number} id
 * @property {number} postId
 * @property {string} imageUrl
 * @property {string} createdAt
 *
 * @typedef {Object} Post
 * @property {number} id
 * @property {UserProfile} author
 * @property {string} title
 * @property {string} content
 * @property {PostImage[]} images
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} Comment
 * @property {number} id
 * @property {number} postId
 * @property {UserProfile} author
 * @property {string} content
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} Like
 * @property {number} id
 * @property {number} userId
 * @property {number} postId
 * @property {string} createdAt
 *
 * @typedef {Post & { likeCount: number, likedByMe: boolean, comments: Comment[] }} PostDetail
 *   Post detail includes the like/comment aggregate state.
 *
 * @typedef {Object} FollowSummary  Who the current user follows (user_follows).
 * @property {number} followingCount
 * @property {number} followersCount
 * @property {number[]} followingIds
 *
 * @typedef {Object} AuthSession
 * @property {string} accessToken
 * @property {UserProfile} user
 *
 * @typedef {Object} ApiError
 * @property {number} status
 * @property {string} message
 * @property {Object<string, string[]>} [details]
 *
 * @typedef {Object} Paginated
 * @property {T[]} items
 * @property {number} page
 * @property {number} pageSize
 * @property {number} total
 */