<template>
    <div class="explore-page">
        <div class="placeholder-content">
            <h2>🔍 Explore 페이지</h2>
            <p>준비 중인 기능입니다.</p>
            <div class="coming-soon">
                <ul>
                    <li>추천 북마크 탐색</li>
                    <li>태그 기반 필터링</li>
                    <li>인기 컬렉션 보기</li>
                    <li>공유된 북마크 탐색</li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// Explore 페이지 - 향후 구현 예정
</script>

<style scoped>
.explore-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 40px;
    background-color: var(--background);
}

.placeholder-content {
    text-align: center;
    max-width: 500px;
}

.placeholder-content h2 {
    color: var(--main);
    font-size: 28px;
    margin-bottom: 16px;
}

.placeholder-content p {
    color: var(--grey-lv3);
    font-size: 16px;
    margin-bottom: 24px;
}

.coming-soon {
    background-color: var(--grey-lv1);
    border-radius: 0;
    /* Brutalism: no rounding */
    padding: 24px;
    border: 2px solid var(--grey-lv2);
}

.coming-soon ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.coming-soon li {
    color: var(--font-black);
    font-size: 14px;
    padding: 8px 0;
    border-bottom: 1px solid var(--grey-lv2);
}

.coming-soon li:last-child {
    border-bottom: none;
}

.coming-soon li::before {
    content: '✨ ';
    margin-right: 8px;
}
</style>
