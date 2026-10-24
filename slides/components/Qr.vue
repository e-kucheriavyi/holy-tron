<script setup lang="ts">
	defineProps({
		data: { type: String, required: true },
		label: { type: String },
	})
</script>

<template>
	<div :class="$style.col">
		<div :class="$style.card">
			<QRCode
				:width="300"
				:height="300"
				type="svg"
				:data
				:dotsOptions="{ type: 'square', color: 'black' }"
			/>
			<h2>{{ label || data }}</h2>
		</div>
	</div>
</template>

<style module>
	.col {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.card {
		background-color: #fff;
		color: #000;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		border-radius: 1rem;
		gap: 2rem;
		text-align: center;
	}
</style>
