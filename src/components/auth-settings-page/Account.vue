<template>
  <div class="account-page">
    <!-- 로딩 상태 -->
    <div v-if="!isLoaded" class="loading-state">
      <p>Loading...</p>
    </div>

    <!-- 로그인/로그아웃 상태 분기 -->
    <template v-else>
      <!-- 로그인 상태: MyPage 표시 -->
      <SignedIn>
        <MyPage />
      </SignedIn>

      <!-- 로그아웃 상태: LoginPage 표시 -->
      <SignedOut>
        <LoginPage @show-signup-terms="handleShowSignupTerms" @reset-password="handleResetPassword" />
      </SignedOut>
    </template>

    <!-- 회원가입 약관 모달 -->
    <SignupTermsModal v-if="showSignupModal" @accept="handleAcceptTerms" @reject="handleRejectTerms" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SignedIn, SignedOut, useAuth, useSignUp } from '@clerk/vue'
import LoginPage from './LoginPage.vue'
import MyPage from './MyPage.vue'
import SignupTermsModal from './SignupTermsModal.vue'

// Clerk composables
const { isLoaded } = useAuth()
const { signUp, setActive } = useSignUp()

// State
const showSignupModal = ref(false)
const signupEmail = ref('')
const signupPassword = ref('')
const signupError = ref('')

// 회원가입 약관 모달 표시 (이메일, 비밀번호 저장)
function handleShowSignupTerms(email: string, password: string) {
  signupEmail.value = email
  signupPassword.value = password
  showSignupModal.value = true
}

// 약관 동의 - 회원가입 진행
async function handleAcceptTerms() {
  showSignupModal.value = false

  try {
    if (!signUp.value) {
      console.error('SignUp not loaded')
      return
    }

    // Clerk 회원가입 시도
    const result = await signUp.value.create({
      emailAddress: signupEmail.value,
      password: signupPassword.value,
    })

    // 이메일 인증이 필요한 경우
    if (result.status === 'missing_requirements') {
      // 이메일 인증 코드 전송
      await signUp.value.prepareEmailAddressVerification({ strategy: 'email_code' })
      console.log('Verification email sent')
      // TODO: 이메일 인증 코드 입력 UI 표시
    }

    // 회원가입 완료
    if (result.status === 'complete') {
      // 세션 활성화
      if (setActive.value && result.createdSessionId) {
        await setActive.value({ session: result.createdSessionId })
      }
      console.log('Sign up successful!')
    }

  } catch (error: any) {
    console.error('Sign up error:', error)
    signupError.value = error.errors?.[0]?.message || 'Sign up failed'
    // TODO: 에러 메시지를 사용자에게 표시
  }
}

// 약관 거부 - 모달 닫기
function handleRejectTerms() {
  showSignupModal.value = false
}

// 비밀번호 재설정
function handleResetPassword() {
  // TODO: Clerk의 비밀번호 재설정 플로우 구현
  console.log('Password reset flow')
}
</script>

<style scoped>
/* Account 페이지 컨테이너 */
.account-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background-color: var(--background);
  overflow-y: auto;
  padding: 40px 20px;
}

/* 로딩 상태 */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 24px;
  color: var(--grey-lv3);
}
</style>
