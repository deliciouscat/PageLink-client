import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // 사용자 테이블
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_clerk_id', ['clerkId']),

  // 컬렉션 테이블
  collections: defineTable({
    userId: v.id('users'),
    title: v.string(),
    icon: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  // 북마크 테이블
  bookmarks: defineTable({
    userId: v.id('users'),
    collectionId: v.id('collections'),
    url: v.string(),
    title: v.string(),
    passage: v.string(), // 북마크의 메모/요약
    tags: v.array(v.string()),
    favicon: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_collection', ['collectionId']),

  // 댓글 테이블
  comments: defineTable({
    userId: v.id('users'),
    bookmarkId: v.id('bookmarks'),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_bookmark', ['bookmarkId']),
})
