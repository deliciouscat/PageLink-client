<template>
  <div class="my-page">
    <!-- 로딩 상태 -->
    <div v-if="!isLoaded" class="loading">
      <p>Loading...</p>
    </div>

    <!-- 유저 정보 표시 -->
    <div v-else-if="user" class="user-info-container">
      <!-- 제목 -->
      <h2 class="page-title">{{ $t('my_page') }}</h2>

      <!-- 프로필 섹션 -->
      <div class="profile-section">
        <!-- 프로필 이미지 -->
        <div class="profile-image-wrapper">
          <img v-if="user.imageUrl" :src="user.imageUrl" :alt="user.firstName || 'User'" class="profile-image" />
          <div v-else class="profile-placeholder">
            <PhUserCircle :size="80" weight="bold" />
          </div>
        </div>

        <!-- 유저 정보 -->
        <div class="user-details">
          <!-- 이름 -->
          <div class="info-row">
            <span class="info-label">{{ $t('name') }}</span>
            <span class="info-value">
              {{ user.firstName || '' }} {{ user.lastName || '' }}
            </span>
          </div>

          <!-- 이메일 -->
          <div class="info-row">
            <span class="info-label">{{ $t('email') }}</span>
            <span class="info-value">
              {{ user.emailAddresses?.[0]?.emailAddress || 'N/A' }}
            </span>
          </div>

          <!-- 유저네임 (있는 경우) -->
          <div v-if="user.username" class="info-row">
            <span class="info-label">Username</span>
            <span class="info-value">@{{ user.username }}</span>
          </div>
        </div>
      </div>

      <!-- Clerk UserButton (드롭다운 메뉴) -->
      <div class="user-button-section">
        <UserButton :after-sign-out-url="'/'" :appearance="{
          elements: {
            rootBox: {
              width: '100%',
            },
            userButtonBox: {
              flexDirection: 'row-reverse',
            },
          },
        }" />
      </div>

      <!-- 로그아웃 버튼 -->
      <div class="action-section">
        <button class="logout-button" @click="handleLogout">
          <PhSignOut :size="20" weight="bold" />
          {{ $t('logout') }}
        </button>
      </div>
    </div>

    <!-- 에러 상태 -->
    <div v-else class="error-state">
      <p>Failed to load user information</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useUser, useAuth, UserButton } from '@clerk/vue'
import { PhUserCircle, PhSignOut } from '@phosphor-icons/vue'

// i18n
const { t: $t } = useI18n()

// Clerk composables
const { user, isLoaded } = useUser()
const { signOut } = useAuth()

// 로그아웃 처리
async function handleLogout() {
  try {
    if (signOut.value) {
      await signOut.value()
    }
    // 로그아웃 후 Account 컴포넌트가 자동으로 LoginPage로 전환됨
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<style scoped>
.my-page {
  display: flex;
  flex-direction: column;
  padding: 24px;
  max-width: 500px;
  width: 100%;
}

/* 로딩 상태 */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: var(--grey-lv3);
}

/* 유저 정보 컨테이너 */
.user-info-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 페이지 제목 */
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--font-black);
  margin: 0;
}

/* 프로필 섹션 */
.profile-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background-color: var(--grey-lv1);
  border: 1px solid var(--grey-lv2);
  border-radius: 4px;
}

/* 프로필 이미지 */
.profile-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.profile-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--main);
}

.profile-placeholder {
  color: var(--grey-lv3);
}

/* 유저 상세 정보 */
.user-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--grey-lv3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 16px;
  color: var(--font-black);
  font-weight: 500;
}

/* UserButton 섹션 */
.user-button-section {
  padding: 16px;
  background-color: var(--grey-lv1);
  border: 1px solid var(--grey-lv2);
  border-radius: 4px;
}

/* 액션 섹션 */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 로그아웃 버튼 */
.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: var(--grey-lv1);
  color: var(--notification);
  border: 2px solid var(--notification);
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background-color: var(--notification);
  color: var(--background);
}

.logout-button svg {
  color: inherit;
}

/* 에러 상태 */
.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: var(--notification);
}
</style>
