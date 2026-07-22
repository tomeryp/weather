// Tests for the pure weather logic.
// Run with:  npm test   (uses Node's built-in test runner, no extra installs)

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
    getWeatherConfig,
    isRainy,
    isSunny,
    clothingDatabase,
    getClothingRecommendations
} = require('./weather-logic');

// ---------- getWeatherConfig ----------

test('getWeatherConfig: clear sky during the day is sunny', () => {
    const config = getWeatherConfig(0, 1);
    assert.equal(config.icon, 'sun');
    assert.equal(config.bgClass, 'bg-sunny');
    assert.equal(config.desc, 'שמיים בהירים');
});

test('getWeatherConfig: clear sky at night shows the moon', () => {
    const config = getWeatherConfig(0, 0);
    assert.equal(config.icon, 'moon');
    assert.equal(config.bgClass, 'bg-night');
});

test('getWeatherConfig: partly cloudy switches icon between day and night', () => {
    assert.equal(getWeatherConfig(2, 1).icon, 'cloud-sun');
    assert.equal(getWeatherConfig(2, 0).icon, 'cloud-moon');
});

test('getWeatherConfig: overcast is cloudy regardless of day/night', () => {
    assert.equal(getWeatherConfig(3, 1).bgClass, 'bg-cloudy');
    assert.equal(getWeatherConfig(3, 0).bgClass, 'bg-cloudy');
    assert.equal(getWeatherConfig(3, 1).icon, 'cloud');
});

test('getWeatherConfig: rain codes map to the rainy background', () => {
    for (const code of [61, 63, 65, 80, 81, 82]) {
        assert.equal(getWeatherConfig(code, 1).bgClass, 'bg-rainy', `code ${code}`);
    }
});

test('getWeatherConfig: snow codes map to the snowy background', () => {
    for (const code of [71, 73, 75, 77, 85, 86]) {
        assert.equal(getWeatherConfig(code, 1).bgClass, 'bg-snowy', `code ${code}`);
    }
});

test('getWeatherConfig: thunderstorm codes map to the thunderstorm background', () => {
    for (const code of [95, 96, 99]) {
        assert.equal(getWeatherConfig(code, 1).bgClass, 'bg-thunderstorm', `code ${code}`);
        assert.equal(getWeatherConfig(code, 1).icon, 'cloud-lightning', `code ${code}`);
    }
});

test('getWeatherConfig: unknown code falls back to defaults during the day', () => {
    const config = getWeatherConfig(1234, 1);
    assert.equal(config.desc, 'לא ידוע');
    assert.equal(config.icon, 'help-circle');
    assert.equal(config.bgClass, 'bg-default');
});

test('getWeatherConfig: unknown code at night still uses the night background', () => {
    assert.equal(getWeatherConfig(1234, 0).bgClass, 'bg-night');
});

// ---------- isRainy / isSunny ----------

test('isRainy: true for drizzle, rain, showers and thunderstorm codes', () => {
    for (const code of [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]) {
        assert.equal(isRainy(code), true, `code ${code}`);
    }
});

test('isRainy: false for clear, cloudy and snow codes', () => {
    for (const code of [0, 1, 2, 3, 45, 71, 75]) {
        assert.equal(isRainy(code), false, `code ${code}`);
    }
});

test('isSunny: true only for clear and partly cloudy codes', () => {
    assert.equal(isSunny(0), true);
    assert.equal(isSunny(1), true);
    assert.equal(isSunny(2), true);
    assert.equal(isSunny(3), false);
    assert.equal(isSunny(61), false);
});

// ---------- clothing recommendations ----------

test('getClothingRecommendations: cold and rainy suggests a raincoat and umbrella', () => {
    const names = getClothingRecommendations(10, 61).map(item => item.name);
    assert.ok(names.includes('מעיל גשם'));
    assert.ok(names.includes('מטרייה'));
});

test('getClothingRecommendations: hot and sunny suggests sunglasses and a t-shirt', () => {
    const names = getClothingRecommendations(30, 0).map(item => item.name);
    assert.ok(names.includes('משקפי שמש'));
    assert.ok(names.includes('חולצה קצרה'));
    assert.ok(!names.includes('מטרייה'));
});

test('getClothingRecommendations: freezing weather suggests a beanie', () => {
    const names = getClothingRecommendations(5, 3).map(item => item.name);
    assert.ok(names.includes('כובע צמר'));
    assert.ok(names.includes('סוודר חם'));
});

test('getClothingRecommendations: warm and dry does not suggest rain gear', () => {
    const names = getClothingRecommendations(22, 1).map(item => item.name);
    assert.ok(names.includes('חולצה קצרה'));
    assert.ok(!names.includes('מעיל גשם'));
    assert.ok(!names.includes('מטרייה'));
});

test('getClothingRecommendations: sunglasses need both heat and sun', () => {
    // Hot but rainy -> no sunglasses
    const rainyNames = getClothingRecommendations(30, 61).map(item => item.name);
    assert.ok(!rainyNames.includes('משקפי שמש'));
});

test('every clothing item exposes name, img, desc and a check function', () => {
    for (const item of clothingDatabase) {
        assert.equal(typeof item.name, 'string');
        assert.equal(typeof item.img, 'string');
        assert.equal(typeof item.desc, 'string');
        assert.equal(typeof item.check, 'function');
    }
});
