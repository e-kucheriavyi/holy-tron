import { defineShikiSetup } from '@slidev/types'

const cyberTheme = {
	name: 'cyber-ocean',
	type: 'dark',

	colors: {
		'editor.background': '#0D1B2A',
		'editor.foreground': '#E0F8FF',
		'editorLineNumber.foreground': '#5FA8D3',
		'editorLineNumber.activeForeground': '#00C2FF',
		'editor.selectionBackground': '#164E63',
		'editorCursor.foreground': '#00C2FF',
	},

	tokenColors: [
		// Comments
		{
			scope: [
				'comment',
				'punctuation.definition.comment',
			],
			settings: {
				foreground: '#5FA8D3',
				fontStyle: 'italic',
			},
		},

		// Keywords and control flow
		{
			scope: [
				'keyword',
				'keyword.control',
				'storage',
				'storage.type',
				'storage.modifier',
			],
			settings: {
				foreground: '#00C2FF',
			},
		},

		// Functions and function calls
		{
			scope: [
				'entity.name.function',
				'entity.name.function.js',
				'support.function',
				'meta.function-call',
				'variable.function',
			],
			settings: {
				foreground: '#1DB954',
			},
		},

		// Variables and parameters
		{
			scope: [
				'variable',
				'variable.other',
				'variable.parameter',
				'meta.definition.variable',
			],
			settings: {
				foreground: '#00CED1',
			},
		},

		// Strings
		{
			scope: [
				'string',
				'string.quoted',
				'string.template',
			],
			settings: {
				foreground: '#7CFC00',
			},
		},

		// Numbers and constants
		{
			scope: [
				'constant.numeric',
				'constant.language',
				'constant.character',
			],
			settings: {
				foreground: '#FFB347',
			},
		},

		// Types and classes
		{
			scope: [
				'entity.name.type',
				'entity.name.class',
				'support.type',
				'support.class',
			],
			settings: {
				foreground: '#FFB347',
			},
		},

		// Built-in objects and language support
		{
			scope: [
				'support',
				'support.constant',
				'support.variable',
			],
			settings: {
				foreground: '#00C2FF',
			},
		},

		// Operators and punctuation
		{
			scope: [
				'keyword.operator',
				'punctuation',
				'meta.brace',
			],
			settings: {
				foreground: '#E0F8FF',
			},
		},

		// HTML/XML tags
		{
			scope: [
				'entity.name.tag',
				'entity.other.attribute-name',
			],
			settings: {
				foreground: '#00C2FF',
			},
		},
	],
}

export default defineShikiSetup(() => {
	return {
		themes: {
			dark: cyberTheme,
			light: cyberTheme,
		},
	}
})
