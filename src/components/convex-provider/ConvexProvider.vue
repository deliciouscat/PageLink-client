<template>
  <div v-if="isReady">
    <slot />
  </div>
  <div v-else class="convex-loading">
    <LoadingSpinner size="medium" color="success" text="Connecting to database..." />
  </div>
</template>

<script setup lang="ts">
/**
 * @fileoverview ConvexProvider 컴포넌트
 *
 * 이 컴포넌트는 Convex 클라이언트 컨텍스트를 제공하고 Clerk와 Convex 간의
 * 인증 동기화를 처리합니다. 자식 컴포넌트를 렌더링하기 전에 Convex 클라이언트가
 * 적절히 인증되었는지 확인합니다.
 *
 * 주요 책임:
 * - Clerk 인증으로 Convex 클라이언트 초기화
 * - Clerk와 Convex 데이터베이스 간 사용자 데이터 동기화
 * - 인증이 설정되는 동안 로딩 상태 제공
 * - 인증 토큰 관리 처리
 *
 * @author Vue + Convex + Clerk Auth System
 * @version 1.0.0
 */

import { useConvexClient } from 'convex-vue'
import { useUser, useSession } from '@clerk/vue'
import { provide, ref, watch } from 'vue'
import { useConvexMutation } from 'convex-vue'
import { api } from '../../../convex/_generated/api'
import LoadingSpinner from './LoadingSpinner.vue'

/**
 * 인증 상태 관리를 위한 Clerk 사용자 및 세션 훅.
 * 이 훅들은 현재 사용자의 인증 상태에 대한 반응형 액세스를 제공합니다.
 */
const { user, isLoaded: clerkIsLoaded } = useUser()
const { session, isLoaded: sessionIsLoaded } = useSession()

/**
 * 인증이 설정되었는지 여부를 나타내는 로딩 상태 플래그.
 * 이 플래그가 true로 설정된 후에만 자식 컴포넌트가 렌더링됩니다.
 *
 * 이는 Convex 인증이 제대로 설정되기 전에 자식을 렌더링하는 것을 방지하여
 * 불필요한 API 호출과 잠재적 오류를 방지합니다.
 */
const isReady = ref(false)

/**
 * 백엔드 데이터베이스에 액세스를 제공하는 Convex 클라이언트 인스턴스.
 * 이 클라이언트는 Vue의 provide/inject 시스템을 통해 자식 컴포넌트에 제공됩니다.
 */
const convex = useConvexClient()
provide('convex', convex)

/**
 * 데이터베이스에서 사용자 데이터를 업데이트하기 위한 Convex mutation 훅.
 * 이 mutation은 Clerk에서 Convex로 사용자 프로필 변경 사항을 동기화하는 데 사용됩니다.
 */
const { mutate: updateUserData } = useConvexMutation(api.users.updateUserData)

/**
 * Clerk 인증이 변경될 때 Convex 인증을 업데이트하고 사용자 데이터를 동기화합니다.
 *
 * 이 함수는 여러 중요한 작업을 수행합니다:
 * 1. Clerk 세션에서 Convex auth 토큰 설정
 * 2. 사용자 프로필 데이터를 Convex 데이터베이스에 동기화
 * 3. 자식 컴포넌트가 렌더링될 수 있도록 준비 상태 설정
 *
 * 이 함수는 사용자 또는 세션이 변경될 때마다 호출되어
 * Convex가 항상 최신 인증 상태와 사용자 데이터를 갖도록 보장합니다.
 *
 * @async
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * // 이 함수는 watcher에 의해 자동으로 호출됩니다
 * await updateAuth();
 * ```
 */
const updateAuth = async () => {
  // 진행하기 전에 Clerk 사용자와 세션이 모두 로드될 때까지 대기
  if (!clerkIsLoaded.value || !sessionIsLoaded.value) {
    return
  }

  if (user.value && session.value) {
    try {
      // Clerk 세션에서 Convex 전용 JWT 토큰 가져오기
      const token = await session.value.getToken({ template: 'convex' })
      convex.setAuth(async () => token)

      // 사용자가 변경될 때마다 사용자 데이터를 Convex에 동기화
      if (user.value) {
        await updateUserData({
          clerkId: user.value.id,
          email: user.value.primaryEmailAddress?.emailAddress || '',
          name: `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim(),
        })
      }
    } catch (error) {
      console.error('Error setting up Convex authentication:', error)
      // 오류가 발생하더라도 무한 로딩을 방지하기 위해 ready를 true로 설정해야 합니다
    }
  } else {
    // 사용자가 인증되지 않았을 때 Convex 연결 닫기
    convex.close()
  }

  // 인증 성공/실패와 관계없이 준비 상태 설정
  isReady.value = true
}

/**
 * Clerk 사용자 및 세션 상태 변경을 모니터링하는 watcher.
 *
 * 이 watcher는 다음 상황에서 Convex 인증이 업데이트되도록 보장합니다:
 * - 사용자가 로그인하거나 로그아웃할 때
 * - 사용자 프로필 데이터가 변경될 때
 * - 세션 토큰이 새로고침될 때
 * - Clerk 로딩 상태가 변경될 때
 *
 * immediate: true 옵션은 컴포넌트 마운트 시 함수가 실행되도록 하여
 * 자식을 렌더링하기 전에 인증 상태를 설정합니다.
 */
watch([user, session, clerkIsLoaded, sessionIsLoaded], updateAuth, {
  immediate: true,
})
</script>

<style scoped>
/**
 * Convex 연결 설정을 위한 로딩 스타일.
 * Convex 클라이언트가 인증되고 백엔드에 연결되는 동안
 * 시각적 피드백을 제공합니다.
 */
.convex-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 20px;
}
</style>

