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

const now = new Date().toISOString()

function daysAgo(days) {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

function hoursAgo(h) {
  return new Date(Date.now() - h * 3_600_000).toISOString()
}

function makeUser(id, username, email, role, profile) {
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

export const users = [
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

function toUserProfile(u) {
  const { profile, ...user } = u
  return { user, profile }
}

function makePost(id, authorId, title, content, imageUrls, ageDays) {
  const images = imageUrls.map((url, i) => ({
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
const IMG = (id) => `https://picsum.photos/seed/agri${id}/800/480`

export const posts = [
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

export const comments = [
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

export const likes = [
  { id: 1, userId: 1, postId: 1, createdAt: daysAgo(1) },
  { id: 2, userId: 3, postId: 1, createdAt: daysAgo(1) },
  { id: 3, userId: 2, postId: 2, createdAt: daysAgo(1) },
  { id: 4, userId: 1, postId: 3, createdAt: daysAgo(3) },
  { id: 5, userId: 5, postId: 1, createdAt: hoursAgo(5) },
]

export const follows = [
  { followerId: 1, followingId: 2 },
  { followerId: 3, followingId: 2 },
  { followerId: 5, followingId: 2 },
  { followerId: 1, followingId: 4 },
  { followerId: 3, followingId: 4 },
]

export const communities = [
  {
    id: 1,
    name: 'Maize Growers Kenya',
    description: 'A community for maize farmers to share tips on planting, pest control, and harvest.',
    imageUrl: 'https://picsum.photos/seed/maize/800/400',
    createdBy: 2,
    members: [
      { id: 1, userId: 1, communityId: 1, joinedAt: daysAgo(20) },
      { id: 2, userId: 2, communityId: 1, joinedAt: daysAgo(25) },
      { id: 3, userId: 3, communityId: 1, joinedAt: daysAgo(15) },
    ],
    isMember: true,
    isFollowing: true,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
  },
  {
    id: 2,
    name: 'Avocado Farmers Network',
    description: 'Connect with other avocado growers. Share best practices for avocado farming.',
    imageUrl: 'https://picsum.photos/seed/avocado/800/400',
    createdBy: 3,
    members: [
      { id: 4, userId: 3, communityId: 2, joinedAt: daysAgo(10) },
      { id: 5, userId: 1, communityId: 2, joinedAt: daysAgo(5) },
    ],
    isMember: true,
    isFollowing: false,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(2),
  },
  {
    id: 3,
    name: 'Livestock Health Forum',
    description: 'Discuss livestock health, vaccination schedules, and disease prevention.',
    imageUrl: 'https://picsum.photos/seed/livestock/800/400',
    createdBy: 4,
    members: [
      { id: 6, userId: 4, communityId: 3, joinedAt: daysAgo(20) },
      { id: 7, userId: 1, communityId: 3, joinedAt: daysAgo(12) },
    ],
    isMember: true,
    isFollowing: true,
    createdAt: daysAgo(25),
    updatedAt: daysAgo(3),
  },
]

export const conversations = [
  {
    id: 1,
    communityId: null,
    createdBy: 1,
    participants: [
      { id: 1, conversationId: 1, userId: 1, joinedAt: daysAgo(5) },
      { id: 2, conversationId: 1, userId: 2, joinedAt: daysAgo(5) },
    ],
    createdAt: daysAgo(5),
    updatedAt: hoursAgo(2),
  },
  {
    id: 2,
    communityId: null,
    createdBy: 1,
    participants: [
      { id: 3, conversationId: 2, userId: 1, joinedAt: daysAgo(3) },
      { id: 4, conversationId: 2, userId: 4, joinedAt: daysAgo(3) },
    ],
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(8),
  },
]

export const messages = [
  { id: 1, conversationId: 1, senderId: 1, content: 'Hello Dr. Omena, I have a question about soil preparation.', isRead: true, createdAt: daysAgo(5) },
  { id: 2, conversationId: 1, senderId: 2, content: 'Hi Jane! Sure, what would you like to know?', isRead: true, createdAt: daysAgo(5) },
  { id: 3, conversationId: 1, senderId: 1, content: 'Should I add lime before or after composting?', isRead: true, createdAt: hoursAgo(20) },
  { id: 4, conversationId: 1, senderId: 2, content: 'Add lime first, then compost after about a week. The lime needs time to adjust pH.', isRead: false, createdAt: hoursAgo(2) },
  { id: 5, conversationId: 2, senderId: 1, content: 'Hi Prof, can you recommend a vaccination schedule for dairy cattle?', isRead: true, createdAt: daysAgo(3) },
  { id: 6, conversationId: 2, senderId: 4, content: 'Sure! I will send you a schedule. When did you last vaccinate?', isRead: false, createdAt: hoursAgo(8) },
]

export const communityFollows = [
  { userId: 1, communityId: 1 },
  { userId: 1, communityId: 3 },
  { userId: 3, communityId: 1 },
]

export const currentUserId = 1

export function db() {
  return { users, posts, comments, likes, follows, communities, conversations, messages, communityFollows }
}

// Matches docs/schema.dbml: users in the seed may be experts (role 'expert').
export function isExpert(userId) {
  const u = users.find((u) => u.id === userId)
  return u?.role === 'expert'
}

export { now }