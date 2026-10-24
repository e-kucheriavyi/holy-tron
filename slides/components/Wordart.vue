<script setup lang="ts">
	const { variant } = defineProps({
		variant: { type: String, default: '1' },
	})
</script>

<template>
	<section :class="`style-${variant}`">
		<div class="wordart">
			<h1 class="preview"><slot /></h1>
		</div>
  </section>
</template>

<style scoped>
	* {
		box-sizing: border-box;
	}
	*::before, *::after {
		box-sizing: border-box;
	}
	.wordart {
		position: relative;
		display: inline-block;
	}
	.wordart .preview {
		margin: 0 0 2rem;
		padding: 2rem;
	}

	h1 {
		font-size: 9vmin;
		white-space: nowrap;
		overflow: hidden;
	}

	section {
		position: relative;
	}
	section.style-1 .wordart {
		transform: scale(1.05, 1.25);
	}
	section.style-1 .wordart .preview {
		font-weight: 900;
		color: #fff;
		-webkit-text-fill-color: #fff;
		-webkit-text-stroke: 1px #000;
	}
	section.style-2 .wordart {
		transform: scaleY(1.65);
	}
	section.style-2 .wordart .preview {
		font-weight: 900;
		color: #000;
		transform: rotate(-3deg) skewY(-10deg);
	}
	section.style-3 .wordart {
		transform: scaleY(1.65);
	}
	section.style-3 .wordart .preview {
		font-style: italic;
		color: #fff;
		-webkit-text-fill-color: #fff;
		-webkit-text-stroke: 1px #000;
		text-shadow: 3px 2px 0 #999;
	}
	section.style-4 .wordart .preview {
		font-family: Times New Roman, serif;
		font-weight: 400;
		color: #336699;
		text-shadow: 2px 1px 0 #c1c1c1;
	}
	section.style-5 .wordart {
		transform: scaleY(1.25);
	}
	section.style-5 .wordart .preview {
		font-weight: 900;
		color: #d8d8d8;
		-webkit-text-fill-color: #d8d8d8;
		-webkit-text-stroke: 1px #3333cc;
		-webkit-background-clip: text;
		background-clip: text;
	}
	section.style-5 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		color: #9999ff;
		-webkit-text-fill-color: #9999ff;
		-webkit-text-stroke: transparent;
		transform: translate(0.4vw, 0.25vw);
		mix-blend-mode: darken;
	}
	section.style-6 .wordart {
		transform: scaleX(0.85) translateZ(0);
	}
	section.style-6 .wordart .preview {
		font-weight: 900;
		color: transparent;
		background: linear-gradient(#adadad, #fff);
		-webkit-text-fill-color: transparent;
		-webkit-background-clip: text;
		background-clip: text;
		letter-spacing: 0.25rem;
	}
	section.style-6 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		text-shadow: 0.125em 0.125em #717171;
	}
	section.style-7 .wordart {
		transform: scaleY(1.25);
	}
	section.style-7 .wordart .preview {
		font-family: Impact, sans-serif;
		color: #0066cc;
		-webkit-text-fill-color: #0066cc;
		-webkit-text-stroke: 0.016em #99ccff;
		-webkit-background-clip: text;
		background-clip: text;
	}
	section.style-7 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		text-shadow: 0.094em 0.078em #990000;
	}
	section.style-8 .wordart {
		transform: scaleY(1.25);
	}
	section.style-8 .wordart .preview {
		font-family: Impact, sans-serif;
		color: transparent;
		background: radial-gradient(ellipse at center, #fff812, #ff9a32);
		-webkit-text-fill-color: transparent;
		-webkit-background-clip: text;
		background-clip: text;
	}
	section.style-8 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		text-shadow: 0.094em 0.063em #cdcdcd;
	}
	section.style-9 .wordart {
		transform: scale(0.9, 1.65) rotate(-3deg) skewY(-3deg) translateZ(0);
	}
	section.style-9 .wordart .preview {
		font-family: Impact, sans-serif;
		font-weight: 700;
		color: transparent;
		background: linear-gradient(#6900cc, #cb00cc);
		-webkit-text-fill-color: transparent;
		-webkit-text-stroke: 0.016em #d2a2fe;
		-webkit-background-clip: text;
		background-clip: text;
	}
	section.style-9 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		-webkit-text-stroke: transparent;
		text-shadow: 0.094em 0.063em #adadff;
	}
	section.style-10 .wordart {
		transform: scale(0.85, 1.25);
	}
	section.style-10 .wordart .preview {
		font-family: Times New Roman, serif;
		font-weight: 400;
		color: #1a4b28;
		-webkit-text-fill-color: #1a4b28;
		-webkit-text-stroke: 1.5px #008000;
	}
	section.style-10 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		font-size: 10vmin;
		color: #d2e5dc;
		-webkit-text-fill-color: #d2e5dc;
		-webkit-text-stroke: transparent;
		transform: translate(-2.5vmin, -4vmin);
	}
	section.style-11 .wordart {
		transform: scaleY(1.65);
	}
	section.style-11 .wordart .preview {
		font-weight: 900;
		color: transparent;
		background: linear-gradient(to left, #a104ad, #0b2be0, #329941, #f7f658, #f16412, #e92153, #aa04a7);
		-webkit-text-fill-color: transparent;
		-webkit-text-stroke: 0.016em #eaeaea;
		-webkit-background-clip: text;
		background-clip: text;
		letter-spacing: 0.1rem;
	}
	section.style-11 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		color: #cdcdcd;
		-webkit-text-fill-color: #cdcdcd;
		-webkit-text-stroke: transparent;
		transform: rotateX(63deg) skew(60deg) scaleY(0.65) translate3d(2em, -2.15em, -1em);
	}
	section.style-12 .wordart .preview {
		font-family: Times New Roman, serif;
		font-weight: 400;
		color: transparent;
		background: linear-gradient(#999cfc, #1b999c);
		-webkit-text-fill-color: transparent;
		-webkit-background-clip: text;
		background-clip: text;
	}
	section.style-12 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		text-shadow: 0.031em 0.031em #cdcdcd;
	}
	section.style-13 .wordart {
		transform: scale(0.65, 1.65);
	}
	section.style-thirteen .wordart .preview {
		font-weight: 900;
		color: #896640;
	}
	section.style-13 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		text-shadow: 1px 0 #1b0d00, 2px 0 #1b0d00, 3px 0 #1b0d00, 4px 0 #1b0d00, 5px 0 #1b0d00, 6px 0 #1b0d00, 7px 0 #1b0d00;
	}
	section.style-14 .wordart {
		transform: scale(0.85, 1.3) translateZ(0);
	}
	section.style-14 .wordart .preview {
		font-family: Times New Roman, serif;
		font-weight: 400;
		background: linear-gradient(#fffecb, #ff9999);
		-webkit-text-fill-color: transparent;
		-webkit-background-clip: text;
		background-clip: text;
		letter-spacing: -0.1vw;
	}
	section.style-14 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		text-shadow: -1px 0 0 #002245, 0 -1px 0 #0050a0, -2px -1px 0.25px #002245, -1px -2px 0.25px #0050a0, -3px -2px 0.25px #002245, -2px -3px 0.25px #0050a0, -4px -3px 0.25px #002245, -3px -4px 0.25px #0050a0, -5px -4px 0px #002245, -4px -5px 0px #0050a0;
	}
	section.style-15 .wordart {
		transform: perspective(200px) rotateX(30deg) scaleY(1.65);
	}
	section.style-15 .wordart .preview {
		font-weight: 900;
		color: transparent;
		background: linear-gradient(#551700, #fecb00);
		-webkit-text-fill-color: transparent;
		-webkit-text-stroke: 1px #b2b2b2;
		-webkit-background-clip: text;
		background-clip: text;
		letter-spacing: 0.1vw;
	}
	section.style-15 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		color: #ab8d56;
		-webkit-text-fill-color: #ab8d56;
		-webkit-text-stroke: transparent;
		transform: perspective(250px) translateY(-0.643em) rotateX(70deg) scale(1) translateZ(-1em);
	}
	section.style-16 .wordart {
		transform: scale(0.8, 1.2);
	}
	section.style-16 .wordart .preview {
		font-family: Impact, sans-serif;
		font-weight: 900;
		color: #33ccff;
		-webkit-text-stroke: 1.25px #000099;
		text-shadow: 0.35rem -0.35rem 0 #000099;
		letter-spacing: -0.15vw;
	}
	section.style-17 .wordart {
		transform: scale(1.05, 1.25);
	}
	section.style-17 .wordart .preview {
		font-weight: 900;
		color: transparent;
		background: repeating-linear-gradient(180deg, transparent, transparent 1px, #ffff00 1px, #ffff00 4px), repeating-linear-gradient(-50deg, #808080, #808080 5px, #ffff00 5px, #ffff00 8px);
		-webkit-text-fill-color: transparent;
		-webkit-text-stroke: 1px #000;
		-webkit-background-clip: text;
		background-clip: text;
	}
	section.style-17 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		text-shadow: 3px 2px 0 #999;
	}
	section.style-18 .wordart {
		transform: scaleY(1.5) translateZ(0);
	}
	section.style-18 .wordart .preview {
		font-family: Times New Roman, serif;
		font-weight: 400;
		background: linear-gradient(#b6b6b6 0%, #5f5f5f 20%, #b1b1b1 30%, #fff 64%, #6c6c6c 65%, #373737 66%, #515151 67%, #787878 75%, #d2d2d2 80%, #d2d2d2 100%);
		-webkit-text-fill-color: transparent;
		-webkit-background-clip: text;
		background-clip: text;
	}
	section.style-18 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		text-shadow: -1px 0 0 #4a4a4a, 0 -1px 0 #8b8b8b, -2px -1px 0.125px #4a4a4a, -1px -1px 0.125px #8b8b8b, -3px -2px 0.125px #4a4a4a, -2px -2px 0.125px #8b8b8b, -4px -3px 0.125px #4a4a4a, -3px -3px 0.125px #8b8b8b, -5px -4px 0.125px #4a4a4a, -4px -4px 0.125px #8b8b8b, -5px -5px 0 #4a4a4a, -5px -5px 0 #8b8b8b;
	}
	section.style-19 .wordart {
		transform: scale(0.65, 1.75);
	}
	section.style-19 .wordart .preview {
		font-weight: 900;
		color: #0f3a1a;
		transform: perspective(100px) rotateY(6deg) rotateZ(-7deg);
	}
	section.style-19 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		text-shadow: -1px 0 0 #000800, 0 -1px 0 #005600, -2px -1px 0.125px #000800, -1px -2px 0.125px #005600, -3px -2px 0.125px #000800, -2px -3px 0.125px #005600, -4px -3px 0.125px #000800, -3px -4px 0.125px #005600, -5px -4px 0.125px #000800, -4px -5px 0.125px #005600, -6px -5px 0.125px #000800, -5px -6px 0.125px #005600, -7px -6px 0 #000800;
	}
	section.style-20 .wordart {
		transform: perspective(100px) rotateY(6deg) rotateZ(-3deg) skewY(15deg) scale(0.8, 1.25);
	}
	section.style-20 .wordart .preview {
		font-family: Impact, sans-serif;
		color: transparent;
		background: linear-gradient(to left, #747474, #fff, #747474);
		-webkit-text-fill-color: transparent;
		-webkit-background-clip: text;
		background-clip: text;
	}
	section.style-20 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		text-shadow: -1px 0 0 #72745b, 0 1px 0 #2c2d23, -2px 1px 0.5px #72745b, -1px 2px 0.5px #2c2d23, -3px 2px 0.5px #72745b, -2px 3px 0.5px #2c2d23, -4px 3px 0.5px #72745b, -3px 4px 0.5px #2c2d23, -5px 4px 0.5px #72745b, -4px 5px 0.5px #2c2d23, -6px 5px 0.5px #72745b, -5px 6px 0.5px #2c2d23, -7px 6px 0.5px #72745b, -6px 7px 0.5px #2c2d23, -8px 7px 0.5px #72745b, -7px 8px 0.5px #2c2d23, -9px 8px 0.5px #72745b, -8px 9px 0.5px #2c2d23, -10px 9px 0.5px #72745b, -9px 10px 0.5px #2c2d23, -11px 10px 0.5px #72745b, -10px 11px 0.5px #2c2d23, -12px 11px 0.5px #72745b, -11px 12px 0.5px #2c2d23, -13px 12px 0.5px #72745b, -12px 13px 0.5px #2c2d23, -14px 13px 0.5px #72745b, -13px 14px 0.5px #2c2d23, -15px 14px 0.5px #72745b, -14px 15px 0.5px #2c2d23, -16px 15px 0.5px #72745b, -15px 16px 0.5px #2c2d23, -17px 16px 0.5px #72745b, -16px 17px 0.5px #2c2d23, -18px 17px 0 #72745b, -17px 18px 0 #2c2d23;
	}
	section.style-21 .wordart {
		transform: scaleY(1.5) skewY(-8deg) rotateZ(-3deg) translateZ(0);
	}
	section.style-21 .wordart .preview {
		font-family: Impact, sans-serif;
		color: transparent;
		background: linear-gradient(to bottom left, #fee601, #fee601 15%, #fe4201);
		-webkit-text-fill-color: transparent;
		-webkit-background-clip: text;
		background-clip: text;
	}
	section.style-21 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		text-shadow: 1px 0 0 #813300, 0 1px 0 #c14d00, 2px 1px 0.35px #813300, 1px 2px 0.35px #c14d00, 3px 2px 0.35px #813300, 2px 3px 0.35px #c14d00, 4px 3px 0.35px #813300, 3px 4px 0.35px #c14d00, 5px 4px 0.35px #813300, 4px 5px 0.35px #c14d00, 6px 5px 0.35px #813300, 5px 6px 0.35px #c14d00, 7px 6px 0.35px #813300, 6px 7px 0.35px #c14d00;
	}
	section.style-22 .wordart {
		transform: scale(0.75, 1.65) translateZ(0);
	}
	section.style-22 .wordart .preview {
		font-weight: 900;
		background: linear-gradient(#ccdfec 0%, #7a97bc 20%, #8aacc6 30%, #fff 50%, #b8908f 51%, #80302d 52%, #b84d4a 55%, #e7cfc9 75%, #916e66 100%);
		-webkit-text-fill-color: transparent;
		-webkit-background-clip: text;
		background-clip: text;
		letter-spacing: -0.2vw;
	}
	section.style-22 .wordart .preview::before {
		position: absolute;
		content: attr(data-content);
		z-index: -1;
		text-shadow: 1px 0 0 #000, 0 1px 1px #a1a1a1, 2px 1px 1px #000, 1px 2px 1px #a1a1a1, 3px 2px 1px #000, 2px 3px 1px #a1a1a1, 4px 3px 1px #000, 3px 4px 1px #a1a1a1, 5px 4px 1px #000, 4px 5px 1px #a1a1a1, 6px 5px 1px #000, 5px 6px 1px #a1a1a1, 7px 6px 1px #000, 6px 7px 1px #a1a1a1, 8px 7px 1px #000, 7px 8px 1px #a1a1a1, 9px 8px 1px #000, 8px 9px 1px #a1a1a1, 10px 9px 0 #000;
	}

	select#wordart-style {
		margin-bottom: 1rem;
		background: #fff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="%23727272" viewBox="0 0 20 20"><path d="M5 8l6 6 6-6z"/></svg>') right 0.5rem center no-repeat;
		padding: 0.75rem 1.5rem 0.75rem 0.75rem;
	}
</style>
