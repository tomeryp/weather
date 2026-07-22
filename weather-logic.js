// Pure weather logic (no DOM, no network).
// Loaded as a plain <script> in the browser (exposes globals) and
// imported by the tests in Node via module.exports.

// Map WMO Weather Codes to descriptions, icons, backgrounds
function getWeatherConfig(code, isDay) {
    const config = {
        desc: 'לא ידוע',
        icon: 'help-circle',
        bgClass: 'bg-default'
    };

    if (isDay === 0) {
        config.bgClass = 'bg-night';
    }

    switch (code) {
        case 0:
            config.desc = 'שמיים בהירים';
            config.icon = isDay === 0 ? 'moon' : 'sun';
            config.bgClass = isDay === 0 ? 'bg-night' : 'bg-sunny';
            break;
        case 1:
        case 2:
            config.desc = 'בהיר לרוב / מעונן חלקית';
            config.icon = isDay === 0 ? 'cloud-moon' : 'cloud-sun';
            config.bgClass = isDay === 0 ? 'bg-night' : 'bg-sunny';
            break;
        case 3:
            config.desc = 'מעונן';
            config.icon = 'cloud';
            config.bgClass = 'bg-cloudy';
            break;
        case 45:
        case 48:
            config.desc = 'ערפל';
            config.icon = 'cloud-fog';
            config.bgClass = 'bg-cloudy';
            break;
        case 51:
        case 53:
        case 55:
            config.desc = 'טפטוף קל / בינוני';
            config.icon = 'cloud-drizzle';
            config.bgClass = 'bg-rainy';
            break;
        case 56:
        case 57:
            config.desc = 'טפטוף קפוא';
            config.icon = 'cloud-snow';
            config.bgClass = 'bg-snowy';
            break;
        case 61:
        case 63:
        case 65:
            config.desc = 'גשם רגיל / חזק';
            config.icon = 'cloud-rain';
            config.bgClass = 'bg-rainy';
            break;
        case 66:
        case 67:
            config.desc = 'גשם קפוא';
            config.icon = 'cloud-hail';
            config.bgClass = 'bg-snowy';
            break;
        case 71:
        case 73:
        case 75:
        case 77:
            config.desc = 'שלג';
            config.icon = 'snowflake';
            config.bgClass = 'bg-snowy';
            break;
        case 80:
        case 81:
        case 82:
            config.desc = 'ממטרים מקומיים (גשם שוטף)';
            config.icon = 'cloud-showers-heavy';
            config.bgClass = 'bg-rainy';
            break;
        case 85:
        case 86:
            config.desc = 'ממטרי שלג קלים';
            config.icon = 'snowflake';
            config.bgClass = 'bg-snowy';
            break;
        case 95:
        case 96:
        case 99:
            config.desc = 'סופות רעמים וברקים';
            config.icon = 'cloud-lightning';
            config.bgClass = 'bg-thunderstorm';
            break;
    }
    return config;
}

function isRainy(code) {
    // Open-Meteo rain, drizzle, showers, or thunderstorm codes
    return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
}

function isSunny(code) {
    // Clear sky, mainly clear, partly cloudy
    return [0, 1, 2].includes(code);
}

// Clothing Database & Rules
const clothingDatabase = [
    {
        name: 'מעיל גשם',
        img: 'assets/raincoat.jpg',
        desc: 'מעיל גשם חם ונוגד מים - מומלץ ליום גשום וקריר!',
        check: (temp, code) => isRainy(code) && temp < 15
    },
    {
        name: 'מטרייה',
        img: 'assets/umbrella.jpg',
        desc: 'מטרייה - אל תשכח לקחת כדי להישאר יבש בגשם!',
        check: (temp, code) => isRainy(code)
    },
    {
        name: 'סוודר חם',
        img: 'assets/sweater.jpg',
        desc: 'סוודר חם - מושלם למזג אוויר קריר ויבש.',
        check: (temp, code) => temp < 15 && !isRainy(code)
    },
    {
        name: 'משקפי שמש',
        img: 'assets/sunglasses.jpg',
        desc: 'משקפי שמש - השמש חזקה בחוץ, שמור על העיניים!',
        check: (temp, code) => temp > 25 && isSunny(code)
    },
    {
        name: 'חולצה קצרה',
        img: 'assets/tshirt.jpg',
        desc: 'חולצה קצרה ובגדים קלים - חם ונעים בחוץ!',
        check: (temp, code) => temp >= 18 && !isRainy(code)
    },
    {
        name: 'כובע צמר',
        img: 'assets/beanie.jpg',
        desc: 'כובע צמר - לשמירה על חום הגוף בימים קרים במיוחד.',
        check: (temp, code) => temp < 10
    }
];

// Given a temperature and weather code, return the list of matching clothing items.
function getClothingRecommendations(temp, code) {
    return clothingDatabase.filter(item => item.check(temp, code));
}

// Export for Node (tests). In the browser these stay as globals.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getWeatherConfig,
        isRainy,
        isSunny,
        clothingDatabase,
        getClothingRecommendations
    };
}
