import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { postsService } from '@/services'

const initialState = {
  feed: [],
  feedStatus: 'idle',
  feedError: null,
  current: null,
  currentStatus: 'idle',
  currentError: null,
  userPosts: [],
  userPostsStatus: 'idle',
  userPostsError: null,
  communityPosts: [],
  communityPostsCommunityId: null,
  communityPostsStatus: 'idle',
  communityPostsError: null,
  savedPosts: [],
  savedPostsStatus: 'idle',
  savedPostsError: null,
  likeLoadingPostId: null,
  reactionLoadingPostId: null,
  saveLoadingPostId: null,
  repostLoadingPostId: null,
  updateLoadingPostId: null,
  updateError: null,
  deleteLoadingPostId: null,
  deleteError: null,
}

export const fetchFeed = createAsyncThunk(
  'posts/fetchFeed',
  async ({ page = 1, pageSize = 10 } = {}, { rejectWithValue }) => {
    try {
      const result = await postsService.listPosts(page, pageSize)
      return result.items
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load posts.')
    }
  },
)

export const fetchPost = createAsyncThunk(
  'posts/fetchPost',
  async (postId, { rejectWithValue }) => {
    try {
      return await postsService.getPost(postId)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load post.')
    }
  },
)

export const fetchUserPosts = createAsyncThunk(
  'posts/fetchUserPosts',
  async (userId, { rejectWithValue }) => {
    try {
      return await postsService.listUserPosts(userId)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load posts.')
    }
  },
)

export const fetchCommunityPosts = createAsyncThunk(
  'posts/fetchCommunityPosts',
  async (communityId, { rejectWithValue }) => {
    try {
      const posts = await postsService.listCommunityPosts(communityId)
      return { communityId, posts }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load community posts.')
    }
  },
)

export const fetchSavedPosts = createAsyncThunk(
  'posts/fetchSavedPosts',
  async (_, { rejectWithValue }) => {
    try {
      return await postsService.listSavedPosts()
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to load saved posts.')
    }
  },
)

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (input, { rejectWithValue }) => {
    try {
      return await postsService.createPost(input)
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to create post.')
    }
  },
)

function findPost(state, postId) {
  return (
    (state.current?.id === postId ? state.current : null) ??
    state.feed.find((p) => p.id === postId) ??
    state.userPosts.find((p) => p.id === postId) ??
    state.communityPosts.find((p) => p.id === postId) ??
    state.savedPosts.find((p) => p.id === postId)
  )
}

export const toggleLike = createAsyncThunk(
  'posts/toggleLike',
  async (postId, { getState, rejectWithValue }) => {
    const post = findPost(getState().posts, postId)
    const wasLiked = post?.likedByMe ?? false
    const currentCount = post?.likeCount ?? 0

    try {
      if (wasLiked) {
        await postsService.unlikePost(postId)
      } else {
        await postsService.likePost(postId)
      }
      return {
        postId,
        likedByMe: !wasLiked,
        likeCount: Math.max(0, currentCount + (wasLiked ? -1 : 1)),
      }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to update like.')
    }
  },
)

export const setReaction = createAsyncThunk(
  'posts/setReaction',
  async ({ postId, reactionType }, { getState, rejectWithValue }) => {
    const post = findPost(getState().posts, postId)
    const previousReaction = post?.myReaction ?? null

    try {
      await postsService.setReaction(postId, reactionType)
      return { postId, reactionType, previousReaction }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to add reaction.')
    }
  },
)

export const removeReaction = createAsyncThunk(
  'posts/removeReaction',
  async (postId, { getState, rejectWithValue }) => {
    const post = findPost(getState().posts, postId)
    const previousReaction = post?.myReaction ?? null

    try {
      await postsService.removeReaction(postId)
      return { postId, previousReaction }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to remove reaction.')
    }
  },
)

export const toggleSave = createAsyncThunk(
  'posts/toggleSave',
  async (postId, { getState, rejectWithValue }) => {
    const post = findPost(getState().posts, postId)
    const wasSaved = post?.savedByMe ?? false

    try {
      if (wasSaved) {
        await postsService.unsavePost(postId)
      } else {
        await postsService.savePost(postId)
      }
      return { postId, savedByMe: !wasSaved }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to update saved post.')
    }
  },
)

export const toggleRepost = createAsyncThunk(
  'posts/toggleRepost',
  async (postId, { getState, rejectWithValue }) => {
    const state = getState()
    const post = findPost(state.posts, postId)
    const wasReposted = post?.repostedByMe ?? false
    const rootId = post?.originalPostId ?? postId
    const currentUserId = state.auth.user?.user.id

    try {
      let createdRepost = null
      if (wasReposted) {
        await postsService.unrepostPost(postId)
      } else {
        createdRepost = await postsService.repostPost(postId, '')
      }
      return { rootId, repostedByMe: !wasReposted, createdRepost, currentUserId }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to update repost.')
    }
  },
)

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ postId, title, content }, { rejectWithValue }) => {
    try {
      return await postsService.updatePost(postId, { title, content })
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to update post.')
    }
  },
)

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await postsService.deletePost(postId)
      return postId
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to delete post.')
    }
  },
)

export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, content }, { rejectWithValue }) => {
    try {
      const comment = await postsService.addComment(postId, content)
      return { postId, comment }
    } catch (error) {
      return rejectWithValue(error?.message ?? 'Failed to add comment.')
    }
  },
)

function everyPostList(state) {
  return [state.feed, state.userPosts, state.communityPosts, state.savedPosts]
}

function forEachMatchingPost(state, postId, apply) {
  if (state.current?.id === postId) apply(state.current)
  everyPostList(state).forEach((list) => {
    const post = list.find((p) => p.id === postId)
    if (post) apply(post)
  })
}

function forEachRelatedToRoot(state, rootId, apply) {
  const matches = (post) => post.id === rootId || post.originalPostId === rootId
  if (state.current && matches(state.current)) apply(state.current)
  everyPostList(state).forEach((list) => {
    list.filter(matches).forEach(apply)
  })
}

function removeOwnRepostOfRoot(list, rootId, currentUserId) {
  return list.filter((p) => !(p.originalPostId === rootId && p.author.user.id === currentUserId))
}

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => {
        state.feedStatus = 'loading'
        state.feedError = null
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.feed = action.payload
        state.feedStatus = 'ready'
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.feedStatus = 'error'
        state.feedError = action.payload
      })
      .addCase(fetchPost.pending, (state) => {
        state.currentStatus = 'loading'
        state.currentError = null
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.current = action.payload
        state.currentStatus = 'ready'
      })
      .addCase(fetchPost.rejected, (state, action) => {
        state.currentStatus = 'error'
        state.currentError = action.payload
      })
      .addCase(fetchUserPosts.pending, (state) => {
        state.userPostsStatus = 'loading'
        state.userPostsError = null
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.userPosts = action.payload
        state.userPostsStatus = 'ready'
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.userPostsStatus = 'error'
        state.userPostsError = action.payload
      })
      .addCase(fetchCommunityPosts.pending, (state) => {
        state.communityPostsStatus = 'loading'
        state.communityPostsError = null
      })
      .addCase(fetchCommunityPosts.fulfilled, (state, action) => {
        state.communityPosts = action.payload.posts
        state.communityPostsCommunityId = action.payload.communityId
        state.communityPostsStatus = 'ready'
      })
      .addCase(fetchCommunityPosts.rejected, (state, action) => {
        state.communityPostsStatus = 'error'
        state.communityPostsError = action.payload
      })
      .addCase(fetchSavedPosts.pending, (state) => {
        state.savedPostsStatus = 'loading'
        state.savedPostsError = null
      })
      .addCase(fetchSavedPosts.fulfilled, (state, action) => {
        state.savedPosts = action.payload
        state.savedPostsStatus = 'ready'
      })
      .addCase(fetchSavedPosts.rejected, (state, action) => {
        state.savedPostsStatus = 'error'
        state.savedPostsError = action.payload
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.feed.unshift(action.payload)
        state.feedStatus = 'ready'
        if (action.payload.communityId && state.communityPostsCommunityId === action.payload.communityId) {
          state.communityPosts.unshift(action.payload)
        }
      })
      .addCase(toggleLike.pending, (state, action) => {
        state.likeLoadingPostId = action.meta.arg
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        forEachMatchingPost(state, action.payload.postId, (post) => {
          post.likedByMe = action.payload.likedByMe
          post.likeCount = action.payload.likeCount
        })
        state.likeLoadingPostId = null
      })
      .addCase(toggleLike.rejected, (state) => {
        state.likeLoadingPostId = null
      })
      .addCase(setReaction.pending, (state, action) => {
        state.reactionLoadingPostId = action.meta.arg.postId
      })
      .addCase(setReaction.fulfilled, (state, action) => {
        const { postId, reactionType, previousReaction } = action.payload
        forEachMatchingPost(state, postId, (post) => {
          const counts = { ...post.reactionCounts }
          if (previousReaction) counts[previousReaction] = Math.max(0, (counts[previousReaction] ?? 1) - 1)
          counts[reactionType] = (counts[reactionType] ?? 0) + 1
          post.reactionCounts = counts
          post.myReaction = reactionType
          post.likedByMe = true
          post.likeCount = Object.values(counts).reduce((sum, n) => sum + n, 0)
        })
        state.reactionLoadingPostId = null
      })
      .addCase(setReaction.rejected, (state) => {
        state.reactionLoadingPostId = null
      })
      .addCase(removeReaction.pending, (state, action) => {
        state.reactionLoadingPostId = action.meta.arg
      })
      .addCase(removeReaction.fulfilled, (state, action) => {
        const { postId, previousReaction } = action.payload
        forEachMatchingPost(state, postId, (post) => {
          const counts = { ...post.reactionCounts }
          if (previousReaction) counts[previousReaction] = Math.max(0, (counts[previousReaction] ?? 1) - 1)
          if (counts[previousReaction] === 0) delete counts[previousReaction]
          post.reactionCounts = counts
          post.myReaction = null
          post.likedByMe = false
          post.likeCount = Object.values(counts).reduce((sum, n) => sum + n, 0)
        })
        state.reactionLoadingPostId = null
      })
      .addCase(removeReaction.rejected, (state) => {
        state.reactionLoadingPostId = null
      })
      .addCase(toggleSave.pending, (state, action) => {
        state.saveLoadingPostId = action.meta.arg
      })
      .addCase(toggleSave.fulfilled, (state, action) => {
        const { postId, savedByMe } = action.payload
        forEachMatchingPost(state, postId, (post) => {
          post.savedByMe = savedByMe
          post.saveCount = Math.max(0, post.saveCount + (savedByMe ? 1 : -1))
        })
        if (!savedByMe) {
          state.savedPosts = state.savedPosts.filter((p) => p.id !== postId)
        }
        state.saveLoadingPostId = null
      })
      .addCase(toggleSave.rejected, (state) => {
        state.saveLoadingPostId = null
      })
      .addCase(toggleRepost.pending, (state, action) => {
        state.repostLoadingPostId = action.meta.arg
      })
      .addCase(toggleRepost.fulfilled, (state, action) => {
        const { rootId, repostedByMe, createdRepost, currentUserId } = action.payload
        forEachRelatedToRoot(state, rootId, (post) => {
          post.repostedByMe = repostedByMe
          post.repostCount = Math.max(0, post.repostCount + (repostedByMe ? 1 : -1))
        })
        if (createdRepost) {
          state.feed.unshift(createdRepost)
        } else {
          state.feed = removeOwnRepostOfRoot(state.feed, rootId, currentUserId)
          state.communityPosts = removeOwnRepostOfRoot(state.communityPosts, rootId, currentUserId)
          state.userPosts = removeOwnRepostOfRoot(state.userPosts, rootId, currentUserId)
          state.savedPosts = removeOwnRepostOfRoot(state.savedPosts, rootId, currentUserId)
        }
        state.repostLoadingPostId = null
      })
      .addCase(toggleRepost.rejected, (state) => {
        state.repostLoadingPostId = null
      })
      .addCase(updatePost.pending, (state, action) => {
        state.updateLoadingPostId = action.meta.arg.postId
        state.updateError = null
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        forEachMatchingPost(state, action.payload.id, (post) => {
          post.title = action.payload.title
          post.content = action.payload.content
          post.updatedAt = action.payload.updatedAt
        })
        state.updateLoadingPostId = null
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.updateLoadingPostId = null
        state.updateError = action.payload
      })
      .addCase(deletePost.pending, (state, action) => {
        state.deleteLoadingPostId = action.meta.arg
        state.deleteError = null
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        const postId = action.payload
        state.feed = state.feed.filter((p) => p.id !== postId)
        state.userPosts = state.userPosts.filter((p) => p.id !== postId)
        state.communityPosts = state.communityPosts.filter((p) => p.id !== postId)
        state.savedPosts = state.savedPosts.filter((p) => p.id !== postId)
        if (state.current?.id === postId) state.current = null
        state.deleteLoadingPostId = null
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.deleteLoadingPostId = null
        state.deleteError = action.payload
      })
      .addCase(addComment.fulfilled, (state, action) => {
        forEachMatchingPost(state, action.payload.postId, (post) => {
          post.comments.push(action.payload.comment)
        })
      })
  },
})

export default postsSlice.reducer
