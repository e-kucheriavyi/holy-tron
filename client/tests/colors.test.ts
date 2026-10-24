import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Color, SRGBColorSpace } from 'three'
import { playerColor } from '../src/colors.ts'

test('all actual server HSL colors retain their hue rather than becoming grey', () => {
  for (let i = 0; i < 1000; i++) {
    const hue = (i * 137.508) % 360, lightness = i % 2 === 0 ? 52 : 68
    const value = `hsl(${hue.toFixed(1)} 78% ${lightness}%)`
    const actual = playerColor(value)
    const expected = new Color().setHSL(Number(hue.toFixed(1)) / 360, .78, lightness / 100, SRGBColorSpace)
    assert.equal(actual.getHexString(), expected.getHexString(), value)
    assert.ok(Math.max(actual.r, actual.g, actual.b) - Math.min(actual.r, actual.g, actual.b) > .2, value)
  }
})

test('hex skins and legacy comma-separated HSL keep their colors', () => {
  assert.equal(playerColor('#ff20cf').getHexString(), 'ff20cf')
  assert.equal(playerColor('hsl(120, 100%, 50%)').getHexString(), '00ff00')
  assert.equal(playerColor('hsl(-120 100% 50%)').getHexString(), '0000ff')
})
