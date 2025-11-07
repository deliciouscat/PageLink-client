import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

/**
 * 북마크 목록 조회 (사용자별)
 */
export const getBookmarks = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) return []

    return await ctx.db
      .query('bookmarks')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
  },
})

/**
 * 컬렉션별 북마크 조회
 */
export const getBookmarksByCollection = query({
  args: {
    collectionId: v.id('collections'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) return []

    // 컬렉션이 사용자 소유인지 확인
    const collection = await ctx.db.get(args.collectionId)
    if (!collection || collection.userId !== user._id) return []

    return await ctx.db
      .query('bookmarks')
      .withIndex('by_collection', (q) => q.eq('collectionId', args.collectionId))
      .collect()
  },
})

/**
 * 북마크 생성
 */
export const createBookmark = mutation({
  args: {
    collectionId: v.id('collections'),
    url: v.string(),
    title: v.string(),
    passage: v.string(),
    tags: v.array(v.string()),
    favicon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) throw new Error('User not found')

    // 컬렉션이 사용자 소유인지 확인
    const collection = await ctx.db.get(args.collectionId)
    if (!collection || collection.userId !== user._id) {
      throw new Error('Collection not found or unauthorized')
    }

    const now = Date.now()
    return await ctx.db.insert('bookmarks', {
      userId: user._id,
      collectionId: args.collectionId,
      url: args.url,
      title: args.title,
      passage: args.passage,
      tags: args.tags,
      favicon: args.favicon,
      createdAt: now,
      updatedAt: now,
    })
  },
})

/**
 * 북마크 업데이트
 */
export const updateBookmark = mutation({
  args: {
    id: v.id('bookmarks'),
    url: v.optional(v.string()),
    title: v.optional(v.string()),
    passage: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    favicon: v.optional(v.string()),
    collectionId: v.optional(v.id('collections')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) throw new Error('User not found')

    const bookmark = await ctx.db.get(args.id)
    if (!bookmark) throw new Error('Bookmark not found')
    if (bookmark.userId !== user._id) throw new Error('Unauthorized')

    // 컬렉션 변경 시 권한 확인
    if (args.collectionId) {
      const collection = await ctx.db.get(args.collectionId)
      if (!collection || collection.userId !== user._id) {
        throw new Error('Collection not found or unauthorized')
      }
    }

    const updates: {
      url?: string
      title?: string
      passage?: string
      tags?: string[]
      favicon?: string
      collectionId?: typeof args.collectionId
      updatedAt: number
    } = {
      updatedAt: Date.now(),
    }
    if (args.url !== undefined) updates.url = args.url
    if (args.title !== undefined) updates.title = args.title
    if (args.passage !== undefined) updates.passage = args.passage
    if (args.tags !== undefined) updates.tags = args.tags
    if (args.favicon !== undefined) updates.favicon = args.favicon
    if (args.collectionId !== undefined) updates.collectionId = args.collectionId

    return await ctx.db.patch(args.id, updates)
  },
})

/**
 * 북마크 삭제
 */
export const deleteBookmark = mutation({
  args: {
    id: v.id('bookmarks'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) throw new Error('User not found')

    const bookmark = await ctx.db.get(args.id)
    if (!bookmark) throw new Error('Bookmark not found')
    if (bookmark.userId !== user._id) throw new Error('Unauthorized')

    // 북마크에 속한 모든 댓글 삭제
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_bookmark', (q) => q.eq('bookmarkId', args.id))
      .collect()

    for (const comment of comments) {
      await ctx.db.delete(comment._id)
    }

    return await ctx.db.delete(args.id)
  },
})
