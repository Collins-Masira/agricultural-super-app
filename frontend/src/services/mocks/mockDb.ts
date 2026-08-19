/**
 * MOCK DATA LAYER — DEVELOPMENT ONLY.
 *
 * This module simulates the backend API so the UI can be built before the
 * backend exists. It is isolated under services/mocks/ and MUST NOT be
 * treated as production code. When the backend API is available, flip
 * VITE_USE_MOCKS=false and the services will use the real HTTP client.
 *
 * The seed data mirrors the schema in docs/schema.dbml.
 */

import {
  Comment,
  Like,
  Post,
  PostImage,
  Profile,
  User,
  UserProfile,
} from '@/types/domain'

export interface MockDb {
  users: (User & { profile: Profile })[]
  posts: Post[]
  comments: Comment[]
  likes: Like[]
  follows: { followerId: number; followingId: number }[]
}

const now = new Date().toISOString()

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

function makeUser(
  id: number,
  username: string,
  email: string,
  role: User['role'],
  profile: Partial<Profile>,
): MockDb['users'][number] {
  return {
    id,
    username,
    email,
    role,
    isActive: true,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
    profile: {
      id,
      userId: id,
      firstName: null,
      lastName: null,
      bio: null,
      location: null,
      profileImageUrl: null,
      phoneNumber: null,
      isVerified: false,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
      ...profile,
    },
  }
}

export const users: MockDb['users'] = [
  makeUser(1, 'jane_kamau', 'jane@example.com', 'farmer', {
    firstName: 'Jane',
    lastName: 'Kamau',
    location: 'Nakuru, Kenya',
    bio: 'Smallholder farmer growing maize and beans.',
  }),
  makeUser(2, 'dr_omena', 'omena@example.com', 'expert', {
    firstName: 'David',
    lastName: 'Omena',
    location: 'Nairobi, Kenya',
    bio: 'Agronomist specialising in soil health and conservation agriculture.',
    isVerified: true,
  }),
  makeUser(3, 'grace_wanjiru', 'grace@example.com', 'farmer', {
    firstName: 'Grace',
    lastName: 'Wanjiru',
    location: 'Meru, Kenya',
    bio: 'Avocado and macadamia grower.',
  }),
  makeUser(4, 'prof_ndungu', 'ndungu@example.com', 'expert', {
    firstName: 'Samuel',
    lastName: 'Ndungu',
    location: 'Eldoret, Kenya',
    bio: 'Veterinarian and livestock health advisor.',
    isVerified: true,
  }),
  makeUser(5, 'collins_m', 'collins@example.com', 'farmer', {
    firstName: 'Collins',
    lastName: 'Masira',
    location: 'Kisii, Kenya',
    bio: 'Tea and dairy farmer.',
  }),
]

function toUserProfile(u: MockDb['users'][number]): UserProfile {
  const { profile, ...user } = u
  return { user, profile }
}

function makePost(
  id: number,
  authorId: number,
  title: string,
  content: string,
  imageUrls: string[],
  ageDays: number,
): Post {
  const images: PostImage[] = imageUrls.map((url, i) => ({
    id: id * 100 + i,
    postId: id,
    imageUrl: url,
    createdAt: daysAgo(ageDays),
  }))
  return {
    id,
    author: toUserProfile(users[authorId - 1]),
    title,
    content,
    images,
    createdAt: daysAgo(ageDays),
    updatedAt: daysAgo(ageDays),
  }
}

// Placeholder image service for mock visual development only.
const IMG = (id: number) => `https://picsum.photos/seed/agri${id}/800/480`

export const posts: Post[] = [
  makePost(
    1,
    2,
    'Preparing your soil before the rains',
    'Test your soil first. Add compost at least two weeks before planting and avoid over-tilling, which destroys soil structure. Well-prepared soil holds moisture longer.',
    [IMG(1), IMG(2)],
    1,
  ),
  makePost(
    2,
    1,
    'My maize seedlings at two weeks',
    'The early rains came on time. Seedlings are looking healthy — I used the spacing advice from the community thread.',
    [IMG(3)],
    2,
  ),
  makePost(
    3,
    4,
    'Recognising common cattle diseases early',
    'Watch for changes in appetite and coat condition. Early signs save expensive treatment later. Always isolate a sick animal immediately.',
    [IMG(4)],
    4,
  ),
  makePost(
    4,
    3,
    'Avocado flower drop — is it normal?',
    'Some flower drop is normal, but excessive drop can indicate water stress. Mulch around the tree base to keep the root zone cool and moist.',
    [IMG(5), IMG(6)],
    6,
  ),
]

export const comments: Comment[] = [
  {
    id: 1,
    postId: 1,
    author: toUserProfile(users[0]),
    content: 'How long should the compost rest before planting?',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 2,
    postId: 1,
    author: toUserProfile(users[2]),
    content: 'At least two weeks, longer if you can manage it.',
    createdAt: hoursAgo(18),
    updatedAt: hoursAgo(18),
  },
  {
    id: 3,
    postId: 2,
    author: toUserProfile(users[3]),
    content: 'Great spacing. They look strong!',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
]

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString()
}

export const likes: Like[] = [
  { id: 1, userId: 1, postId: 1, createdAt: daysAgo(1) },
  { id: 2, userId: 3, postId: 1, createdAt: daysAgo(1) },
  { id: 3, userId: 2, postId: 2, createdAt: daysAgo(1) },
  { id: 4, userId: 1, postId: 3, createdAt: daysAgo(3) },
  { id: 5, userId: 5, postId: 1, createdAt: hoursAgo(5) },
]

export const follows: MockDb['follows'] = [
  { followerId: 1, followingId: 2 },
  { followerId: 3, followingId: 2 },
  { followerId: 5, followingId: 2 },
  { followerId: 1, followingId: 4 },
  { followerId: 3, followingId: 4 },
]

export const currentUserId = 1

export function db(): MockDb {
  return { users, posts, comments, likes, follows }
}

// Matches docs/schema.dbml: users in the seed may be experts (role 'expert').
export function isExpert(userId: number): boolean {
  const u = users.find((u) => u.id === userId)
  return u?.role === 'expert'
}

export { now }