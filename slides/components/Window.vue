<script setup lang="ts">
	defineProps({
		title: { type: String, default: "Window" },
		code: { type: Boolean, default: false },
	})
</script>

<template>
	<div :class="['window', code ? 'code': '']">
		<div class="title">
			<div class="title-left">
				<img src="/npp.webp" class="icon">
				{{title}}
			</div>
			<button class="close-button">×</button>
		</div>
		<div class="body">
			<slot />
		</div>
	</div>
</template>

<style scoped>
	.window {
		z-index: 1;
		box-shadow: 0px 2px 40px rgba(0, 0, 0, 0.75);
		background-color: #acd4e7;
		border: 1px solid rgba(0, 0, 0, 0.75);
		border-top-right-radius: 5px;
		border-top-left-radius: 5px;
		display: flex;
		flex-direction: column;
		min-width: 20em;
		overflow: hidden;
		color: #000;
	}

	.window .title {
		padding: 0.25rem 0.5rem;
		background: linear-gradient(0deg, #acd4e7 0%, #8eadce 100%);
		color: #000;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.title-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.window .title .icon {
		height: 1em;
	}

	.window .body {
		padding: 7px;
		height: 100%;
		margin: 0 7px 7px 7px;
		background-color: #fff;
		color: #000;
		flex-grow: 1;
	}

	.code .body {
		background: var(--slidev-code-background);
	}

	.close-button {
		background: linear-gradient(0deg, #d17c6d 0%, #c6614e 50%, #df9587 53%, #e8a699 100%);
		color: #fff;
		font-weight: bold;
		border: 1px solid #000;
		border-radius: 3px;
		cursor: pointer;
		width: 2rem;
	}
</style>
