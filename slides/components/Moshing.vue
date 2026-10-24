<script setup lang="ts">
	import { ref, onMounted, onUnmounted } from "vue"

	type DrawingVariant = "simple" | "diff" | "diff_clear" | "missing"

	const simpleImages = [
		'/jet/01.png',
		'/jet/02.png',
		'/jet/03.png',
		'/jet/04.png',
		'/jet/05.png',
		'/jet/06.png',
		'/jet/07.png',
		'/jet/08.png',
	]

	const diffImages = [
		'/jet/01.png',
		'/jet/02_diff.png',
		'/jet/03_diff.png',
		'/jet/04_diff.png',
		'/jet/05_diff.png',
		'/jet/06_diff.png',
		'/jet/07_diff.png',
		'/jet/08_diff.png',
	]

	const loadedImages = {}

	const loaded = ref(false)

	const framesCount = 8

	const variant = ref<DrawingVariant>("diff")

	const currentFrame = ref(0)

	const draw = () => {
		if (!loaded.value) {
			return
		}

		const ctx = moshingCanvas.getContext("2d")

		const w = moshingCanvas.width
		const h = moshingCanvas.height

		const images = variant.value === "simple" ? simpleImages : diffImages

		if (variant.value === "diff_clear") {
			ctx.clearRect(0, 0, w, h)
		}

		ctx.drawImage(
			loadedImages[images[currentFrame.value]],
			0,
			0,
			w,
			h,
		)
	}

	const handleBack = () => {
		currentFrame.value = Math.max(0, currentFrame.value - 1)

		draw()
	}

	const handleNext = () => {
		if (variant.value === "missing" && currentFrame.value === 4) {
			currentFrame.value = 6
		} else {
			currentFrame.value = Math.min(framesCount - 1, currentFrame.value + 1)
		}

		draw()
	}

	const resize = () => {
		moshingCanvas.width = moshingCanvas.clientWidth
		moshingCanvas.height = moshingCanvas.clientHeight

		draw()
	}

	const loadImages = () => {
		const promises = [...simpleImages, ...diffImages].map((path) => {
			return new Promise((resolve, _) => {
				const img = new Image()

				img.onload = () => {
					loadedImages[path] = img
					resolve()
				}

				img.src = path
			})
		})

		Promise.all(promises).then(() => {
			loaded.value = true
			draw()
		})
	}

	loadImages()

	onMounted(() => {
		draw()

		resize()

		window.addEventListener("resize", resize)
	})

	onUnmounted(() => {
		window.removeEventListener("resize", resize)
	})
</script>

<template>
	<div class="canvasContainer">
		<canvas id="moshingCanvas"></canvas>
		<div class="controls">
			<button class="vista-button-secondary" @click="handleBack">Back</button>
			<input
				type="range"
				:min="0"
				:max="7"
				v-model="currentFrame"
				@input="draw()"
			/>
			<button class="vista-button" @click="handleNext">Next</button>
			<!-- <button @click="handleMode">{{ variant }}</button> -->
		</div>
	</div>
</template>

<style scoped>
	.canvasContainer {
		display: flex;
		width: 100%;
		height: 100%;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	#moshingCanvas {
		background: red;
		aspect-ratio: 16/9;
		flex: 1;
	}

	.controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}
</style>
