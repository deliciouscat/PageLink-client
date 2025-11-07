/**
 * @fileoverview Vue + Convex + Clerk 인증 시스템의 사용자 관리 함수.
 *
 * 이 모듈은 사용자 데이터에 대한 CRUD 작업을 제공하며, 다음을 포함합니다:
 * - Clerk 인증에서 새 사용자 생성
 * - 현재 사용자 정보 조회
 * - 사용자 프로필 데이터 업데이트
 *
 * 모든 함수는 적절한 인증 확인과 데이터 검증을 포함합니다.
 *
 * @author Vue + Convex + Clerk Auth System
 * @version 1.0.0
 */

import { mutation, query } from './_generated/server'

/**
 * 데이터베이스에 새 사용자를 생성하거나 기존 사용자 ID를 반환합니다.
 *
 * 이 함수는 사용자가 Clerk로 처음 인증할 때 호출됩니다.
 * 주어진 Clerk ID로 사용자가 이미 존재하는지 확인하고,
 * 기존 사용자의 ID를 반환하거나 새 사용자 레코드를 생성합니다.
 *
 * @param ctx - 인증 및 데이터베이스 액세스를 포함하는 Convex 컨텍스트
 * @returns Promise<string> - 사용자 ID (기존 또는 새로 생성된)
 *
 * @throws {Error} 사용자가 인증되지 않은 경우
 *
 * @example
 * ```typescript
 * const userId = await getOrCreateUser();
 * ```
 */
export const getOrCreateUser = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (existingUser) return existingUser._id

    return await ctx.db.insert('users', {
      clerkId: identity.subject,
      email: identity.email || '',
      name: `${identity.givenName || ''} ${identity.familyName || ''}`.trim(),
      createdAt: Date.now(),
    })
  },
})

/**
 * 현재 인증된 사용자의 프로필 정보를 조회합니다.
 *
 * 이 쿼리 함수는 Clerk 신원을 기반으로 현재 인증된 사용자의
 * 사용자 데이터를 가져옵니다. 사용자가 인증되지 않았거나
 * 데이터베이스에 사용자가 존재하지 않으면 null을 반환합니다.
 *
 * @param ctx - 인증 및 데이터베이스 액세스를 포함하는 Convex 컨텍스트
 * @returns Promise<User | null> - 현재 사용자의 프로필 데이터 또는 찾을 수 없는 경우 null
 *
 * @example
 * ```typescript
 * const currentUser = await getCurrentUser();
 * if (currentUser) {
 *   console.log(`Welcome, ${currentUser.name}!`);
 * }
 * ```
 */
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()
  },
})

/**
 * 사용자 프로필 데이터를 업데이트하거나 사용자가 존재하지 않으면 새 사용자를 생성합니다.
 *
 * 이 mutation 함수는 사용자 데이터에 대한 upsert 작업을 제공합니다.
 * 입력 매개변수를 검증하고, 인증된 사용자가 자신의 데이터만 업데이트할 수 있도록 보장하며,
 * 기존 사용자 레코드를 업데이트하거나 새 레코드를 생성합니다.
 *
 * @param ctx - 인증 및 데이터베이스 액세스를 포함하는 Convex 컨텍스트
 * @param args - 업데이트할 사용자 데이터를 포함하는 객체
 * @param args.clerkId - Clerk 사용자 ID (인증된 사용자와 일치해야 함)
 * @param args.email - 사용자의 이메일 주소
 * @param args.name - 사용자의 표시 이름
 * @returns Promise<string> - 업데이트/생성된 사용자의 사용자 ID
 *
 * @throws {Error} 필수 필드가 누락된 경우
 * @throws {Error} 이메일 형식이 잘못된 경우
 * @throws {Error} 사용자가 인증되지 않은 경우
 * @throws {Error} 사용자가 다른 사용자의 데이터를 업데이트하려고 시도하는 경우
 *
 * @example
 * ```typescript
 * const userId = await updateUserData({
 *   clerkId: "user_123",
 *   email: "user@example.com",
 *   name: "John Doe"
 * });
 * ```
 */
export const updateUserData = mutation({
  handler: async (ctx, args: { clerkId: string; email: string; name: string }) => {
    // 입력값 검증
    if (!args.clerkId || !args.email) {
      throw new Error('Missing required fields: clerkId and email')
    }

    if (!args.email.includes('@')) {
      throw new Error('Invalid email format')
    }

    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    // 사용자가 자신의 데이터를 업데이트하는지 확인
    if (identity.subject !== args.clerkId) {
      throw new Error('Unauthorized')
    }

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first()

    if (existingUser) {
      // 기존 사용자 업데이트
      return await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
      })
    } else {
      // 존재하지 않으면 새 사용자 생성
      return await ctx.db.insert('users', {
        clerkId: args.clerkId,
        email: args.email,
        name: args.name,
        createdAt: Date.now(),
      })
    }
  },
})

