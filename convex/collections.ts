import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

/**
 * 컬렉션 목록 조회
 * 현재 인증된 사용자의 모든 컬렉션을 반환합니다.
 */
export const getCollections = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) return []

    return await ctx.db
      .query('collections')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
  },
})

/**
 * 컬렉션 생성
 */
export const createCollection = mutation({
  args: {
    title: v.string(),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) throw new Error('User not found')

    const now = Date.now()
    return await ctx.db.insert('collections', {
      userId: user._id,
      title: args.title,
      icon: args.icon,
      createdAt: now,
      updatedAt: now,
    })
  },
})

/**
 * 컬렉션 업데이트
 */
export const updateCollection = mutation({
  args: {
    id: v.id('collections'),
    title: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) throw new Error('User not found')

    const collection = await ctx.db.get(args.id)
    if (!collection) throw new Error('Collection not found')
    if (collection.userId !== user._id) throw new Error('Unauthorized')

    const updates: { title?: string; icon?: string; updatedAt: number } = {
      updatedAt: Date.now(),
    }
    if (args.title !== undefined) updates.title = args.title
    if (args.icon !== undefined) updates.icon = args.icon

    return await ctx.db.patch(args.id, updates)
  },
})

/**
 * 컬렉션 삭제
 */
export const deleteCollection = mutation({
  args: {
    id: v.id('collections'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) throw new Error('User not found')

    const collection = await ctx.db.get(args.id)
    if (!collection) throw new Error('Collection not found')
    if (collection.userId !== user._id) throw new Error('Unauthorized')

    // 컬렉션에 속한 모든 북마크도 삭제
    const bookmarks = await ctx.db
      .query('bookmarks')
      .withIndex('by_collection', (q) => q.eq('collectionId', args.id))
      .collect()

    for (const bookmark of bookmarks) {
      // 북마크에 속한 모든 댓글 삭제
      const comments = await ctx.db
        .query('comments')
        .withIndex('by_bookmark', (q) => q.eq('bookmarkId', bookmark._id))
        .collect()

      for (const comment of comments) {
        await ctx.db.delete(comment._id)
      }

      await ctx.db.delete(bookmark._id)
    }

    return await ctx.db.delete(args.id)
  },
})

