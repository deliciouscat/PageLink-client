import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

/**
 * 북마크별 댓글 조회
 */
export const getCommentsByBookmark = query({
  args: {
    bookmarkId: v.id('bookmarks'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) return []

    // 북마크가 존재하는지 확인
    const bookmark = await ctx.db.get(args.bookmarkId)
    if (!bookmark) return []

    // 북마크가 사용자 소유이거나, 공개 북마크인 경우에만 댓글 조회 가능
    // (현재는 사용자 소유만 허용)
    if (bookmark.userId !== user._id) {
      // 향후 공개 북마크 기능 추가 시 여기서 처리
      return []
    }

    const comments = await ctx.db
      .query('comments')
      .withIndex('by_bookmark', (q) => q.eq('bookmarkId', args.bookmarkId))
      .collect()

    // 사용자 정보와 함께 반환
    const commentsWithUser = await Promise.all(
      comments.map(async (comment) => {
        const commentUser = await ctx.db.get(comment.userId)
        return {
          ...comment,
          userName: commentUser?.name || 'Unknown',
          userEmail: commentUser?.email || '',
        }
      }),
    )

    return commentsWithUser
  },
})

/**
 * URL별 댓글 조회 (북마크 URL 기반)
 */
export const getCommentsByUrl = query({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) return []

    // 해당 URL을 가진 북마크 찾기
    const bookmarks = await ctx.db
      .query('bookmarks')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    const matchingBookmark = bookmarks.find((b) => b.url === args.url)
    if (!matchingBookmark) return []

    const comments = await ctx.db
      .query('comments')
      .withIndex('by_bookmark', (q) => q.eq('bookmarkId', matchingBookmark._id))
      .collect()

    // 사용자 정보와 함께 반환
    const commentsWithUser = await Promise.all(
      comments.map(async (comment) => {
        const commentUser = await ctx.db.get(comment.userId)
        return {
          ...comment,
          userName: commentUser?.name || 'Unknown',
          userEmail: commentUser?.email || '',
          nametag: `${commentUser?.name || 'Unknown'} • ${commentUser?.email?.split('@')[0] || 'User'}`,
        }
      }),
    )

    return commentsWithUser
  },
})

/**
 * 댓글 생성
 */
export const createComment = mutation({
  args: {
    bookmarkId: v.id('bookmarks'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) throw new Error('User not found')

    // 북마크가 존재하는지 확인
    const bookmark = await ctx.db.get(args.bookmarkId)
    if (!bookmark) throw new Error('Bookmark not found')

    // 북마크가 사용자 소유인지 확인 (또는 공개 북마크인지)
    if (bookmark.userId !== user._id) {
      // 향후 공개 북마크 기능 추가 시 여기서 처리
      throw new Error('Unauthorized')
    }

    if (!args.content || args.content.trim() === '') {
      throw new Error('Comment content cannot be empty')
    }

    const now = Date.now()
    return await ctx.db.insert('comments', {
      userId: user._id,
      bookmarkId: args.bookmarkId,
      content: args.content.trim(),
      createdAt: now,
      updatedAt: now,
    })
  },
})

/**
 * 댓글 업데이트
 */
export const updateComment = mutation({
  args: {
    id: v.id('comments'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) throw new Error('User not found')

    const comment = await ctx.db.get(args.id)
    if (!comment) throw new Error('Comment not found')
    if (comment.userId !== user._id) throw new Error('Unauthorized')

    if (!args.content || args.content.trim() === '') {
      throw new Error('Comment content cannot be empty')
    }

    return await ctx.db.patch(args.id, {
      content: args.content.trim(),
      updatedAt: Date.now(),
    })
  },
})

/**
 * 댓글 삭제
 */
export const deleteComment = mutation({
  args: {
    id: v.id('comments'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) throw new Error('User not found')

    const comment = await ctx.db.get(args.id)
    if (!comment) throw new Error('Comment not found')
    if (comment.userId !== user._id) throw new Error('Unauthorized')

    return await ctx.db.delete(args.id)
  },
})
