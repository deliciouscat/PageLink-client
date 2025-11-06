<template>
  <div class="login-page">
    <!-- 제목 -->
    <h2 class="login-title">{{ $t('sign_in') }}</h2>

    <!-- 소셜 로그인 버튼들 -->
    <div class="social-buttons">
      <button class="social-button google" @click="handleSocialSignIn('oauth_google')" :disabled="isLoading">
        <GoogleIcon class="social-icon" />
        <span>{{ $t('continue_with_google') }}</span>
      </button>

      <button class="social-button facebook" @click="handleSocialSignIn('oauth_facebook')" :disabled="isLoading">
        <FacebookIcon class="social-icon" />
        <span>{{ $t('continue_with_facebook') }}</span>
      </button>

      <button class="social-button notion" @click="handleSocialSignIn('oauth_notion')" :disabled="isLoading">
        <NotionIcon class="social-icon" />
        <span>{{ $t('continue_with_notion') }}</span>
      </button>
    </div>

    <!-- 구분선 -->
    <div class="divider">
      <span class="divider-text">{{ $t('or') }}</span>
    </div>

    <!-- 이메일 입력 -->
    <div class="input-group">
      <div class="input-wrapper">
        <PhEnvelopeSimple :size="20" weight="bold" class="input-icon" :class="{ active: emailFocused }" />
        <input v-model="email" type="email" :placeholder="$t('sign_in_with_email')" class="text-input"
          @focus="emailFocused = true" @blur="emailFocused = false" />
      </div>
      <div class="input-underline" :class="{ active: emailFocused }"></div>
    </div>

    <!-- 비밀번호 입력 -->
    <div class="input-group">
      <div class="input-wrapper">
        <PhKey :size="20" weight="bold" class="input-icon" :class="{ active: passwordFocused }" />
        <input v-model="password" type="password" :placeholder="$t('password')" class="text-input"
          @focus="passwordFocused = true" @blur="passwordFocused = false" @keyup.enter="handleSignIn" />
      </div>
      <div class="input-underline" :class="{ active: passwordFocused }"></div>
    </div>

    <!-- 비밀번호 재설정 링크 -->
    <div class="password-reset">
      <span class="reset-question">{{ $t('forget_password') }}</span>
      <button class="reset-link" @click="handleResetPassword">
        {{ $t('reset_password') }}
      </button>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- 하단 버튼 -->
    <div class="action-buttons">
      <button class="button-signup" @click="handleSignUp">
        {{ $t('sign_up') }}
      </button>
      <button class="button-signin" @click="handleSignIn" :disabled="isLoading">
        {{ isLoading ? 'Loading...' : $t('sign_in') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhEnvelopeSimple, PhKey } from '@phosphor-icons/vue'
import { useSignIn } from '@clerk/vue'
import GoogleIcon from '../assets/social-icons/GoogleIcon.vue'
import FacebookIcon from '../assets/social-icons/FacebookIcon.vue'
import NotionIcon from '../assets/social-icons/NotionIcon.vue'

// i18n
const { t: $t } = useI18n()

// Clerk SignIn
const { signIn, isLoaded, setActive } = useSignIn()

// Emits
const emit = defineEmits<{
  showSignupTerms: [email: string, password: string]
  resetPassword: []
}>()

// State
const email = ref('')
const password = ref('')
const emailFocused = ref(false)
const passwordFocused = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// 로그인 처리
async function handleSignIn() {
  if (!isLoaded.value) {
    console.log('Clerk not loaded yet')
    return
  }

  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter email and password'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    console.log('Starting sign in...')

    // Clerk SignIn 시도
    if (!signIn.value) {
      console.error('SignIn object is null')
      errorMessage.value = 'Authentication service not available'
      return
    }

    const result = await signIn.value.create({
      identifier: email.value,
      password: password.value,
    })

    console.log('Sign in result:', result)

    if (result?.status === 'complete') {
      console.log('Sign in complete, activating session...')
      // 세션 활성화
      if (setActive.value && result.createdSessionId) {
        await setActive.value({ session: result.createdSessionId })
        console.log('Session activated successfully')
      } else {
        console.error('setActive is null or no session ID:', {
          setActive: setActive.value,
          sessionId: result.createdSessionId
        })
      }
      // 로그인 성공 - Account 컴포넌트가 자동으로 MyPage로 전환됨
    } else {
      // 추가 인증 필요 (2FA 등)
      console.log('Additional verification required:', result)
      errorMessage.value = 'Additional verification required'
    }
  } catch (err: unknown) {
    console.error('Sign in error:', err)
    const error = err as { errors?: Array<{ message: string }> }
    errorMessage.value = error.errors?.[0]?.message || 'Sign in failed'
  } finally {
    isLoading.value = false
  }
}

// 회원가입 버튼 클릭 - 약관 모달 표시
function handleSignUp() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter email and password'
    return
  }

  // 비밀번호 유효성 검사 (최소 8자)
  if (password.value.length < 8) {
    errorMessage.value = 'Passwords must be 8 characters or more'
    return
  }

  // 이메일 형식 검사 (기본)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    errorMessage.value = 'Please enter a valid email address'
    return
  }

  // 이메일과 비밀번호를 함께 전달
  emit('showSignupTerms', email.value, password.value)
}

// 비밀번호 재설정
function handleResetPassword() {
  emit('resetPassword')
  // TODO: Clerk의 비밀번호 재설정 플로우 구현
  console.log('Password reset requested')
}

// 소셜 로그인 처리
async function handleSocialSignIn(strategy: 'oauth_google' | 'oauth_facebook' | 'oauth_notion') {
  if (!isLoaded.value || !signIn.value) {
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    // Clerk OAuth 리디렉션
    // Clerk가 자동으로 현재 URL로 다시 리다이렉트합니다
    await signIn.value.authenticateWithRedirect({
      strategy,
      redirectUrl: window.location.origin,
      redirectUrlComplete: window.location.origin
    })
  } catch (err: unknown) {
    console.error('Social sign in error:', err)
    const error = err as { errors?: Array<{ message: string }> }
    errorMessage.value = error.errors?.[0]?.message || 'Social sign in failed'
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
}

/* 제목 */
.login-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--font-black);
  margin: 0 0 8px 0;
}

/* 소셜 로그인 버튼 영역 */
.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 20px;
  border: 2px solid var(--grey-lv2);
  border-radius: 2px;
  background-color: var(--background);
  color: var(--font-black);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.social-button:hover:not(:disabled) {
  border-color: var(--grey-lv3);
  background-color: var(--grey-lv1);
}

.social-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.social-button span {
  flex: 1;
  text-align: center;
}

/* 구분선 */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: var(--grey-lv2);
}

.divider-text {
  color: var(--grey-lv3);
  font-size: 14px;
}

/* 입력 그룹 */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-icon {
  color: var(--grey-lv3);
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.input-icon.active {
  color: var(--main);
}

.text-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--font-black);
  font-size: 14px;
  padding: 8px 0;
}

.text-input::placeholder {
  color: var(--grey-lv3);
}

.text-input:focus {
  color: var(--font-black);
}

/* 입력 언더라인 */
.input-underline {
  height: 2px;
  background-color: var(--grey-lv3);
  transition: background-color 0.2s ease;
}

.input-underline.active {
  background-color: var(--main);
}

/* 비밀번호 재설정 */
.password-reset {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.reset-question {
  color: var(--font-black);
}

.reset-link {
  background: none;
  border: none;
  color: var(--main);
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  text-decoration: underline;
}

.reset-link:hover {
  opacity: 0.8;
}

/* 에러 메시지 */
.error-message {
  color: var(--notification);
  font-size: 14px;
  padding: 8px;
  background-color: rgba(255, 0, 0, 0.1);
  border-radius: 4px;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.button-signup,
.button-signin {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

/* 회원가입 버튼 */
.button-signup {
  background-color: transparent;
  color: var(--grey-lv3);
  border: none;
  padding: 10px 16px;
}

.button-signup:hover {
  color: var(--font-black);
}

/* 로그인 버튼 */
.button-signin {
  background-color: var(--grey-lv1);
  color: var(--main);
  border-color: var(--main);
  min-width: 110px;
}

.button-signin:hover:not(:disabled) {
  background-color: var(--main);
  color: var(--background);
}

.button-signin:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
