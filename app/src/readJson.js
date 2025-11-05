const CONFIG_DXG_FILE_PATH = "../../server/configDxg.json";
const CONFIG_AI_FILE_PATH = "../../server/configAi.json";
const CONFIG_HEART_FILE_PATH = "../../server/configHeart.json";
const FAVORITES_FILE_PATH = "../../server/favorites.json";



async function fetchConfig() {
    const response = await fetch(CONFIG_HEART_FILE_PATH);

    try {
        if (!response.ok) {
            throw new Error(`HTTPエラーが発生しました。ステータス: ${response.status}`);
        }

        const configData = await response.json();
        return configData;

    } catch (error) {
        console.error('設定ファイルの読み込み中にエラーが発生しました:', error);
        return null;
    }
}


async function fetchFavorites() {
    const response = await fetch(FAVORITES_FILE_PATH);

    try {
        if (!response.ok) {
            throw new Error(`HTTPエラーが発生しました。ステータス: ${response.status}`);
        }

        const favoritesData = await response.json();
        return favoritesData;

    } catch (error) {
        console.error('設定ファイルの読み込み中にエラーが発生しました:', error);
        return null;
    }
}


function updateAverageChart(data) {
    const averageChart = document.querySelector('.average-hexagon');
    const avgPitch = data["latestDateStats"]["avgPitch"];
    const avgStability = data["latestDateStats"]["avgStability"];
    const avgExpressive = data["latestDateStats"]["avgExpressive"];
    const avgVibratoLongtone = data["latestDateStats"]["avgVibratoLongtone"];
    const avgRhythm = data["latestDateStats"]["avgRhythm"];
    const avgHearing = data["latestDateStats"]["avgHearing"];

    const rect = averageChart.getBoundingClientRect();
    const hexagonHeight = rect.height;
    const hexagonWidth = rect.width;
    const pitchX = hexagonWidth * 0.5;
    const pitchY = hexagonHeight * (0.5 - avgPitch / 200);
    const stabilityX = hexagonWidth * (0.5 + avgStability / 200);
    const stabilityY = hexagonHeight * (0.5 - avgStability / 400);
    const expressiveX = hexagonWidth * (0.5 + avgExpressive / 200);
    const expressiveY = hexagonHeight * (0.5 + avgExpressive / 400);
    const hearingX = hexagonWidth * 0.5;
    const hearingY = hexagonHeight * (0.5 + avgHearing / 200);
    const rhythmX = hexagonWidth * (0.5 - avgRhythm / 200);
    const rhythmY = hexagonHeight * (0.5 + avgRhythm / 400);
    const vibratoLongtoneX = hexagonWidth * (0.5 - avgVibratoLongtone / 200);
    const vibratoLongtoneY = hexagonHeight * (0.5 - avgVibratoLongtone / 400);
    const chartPath = `polygon(
        ${pitchX}px ${pitchY}px,
        ${stabilityX}px ${stabilityY}px,
        ${expressiveX}px ${expressiveY}px,
        ${hearingX}px ${hearingY}px,
        ${rhythmX}px ${rhythmY}px,
        ${vibratoLongtoneX}px ${vibratoLongtoneY}px
    )`;
    averageChart.style.clipPath = chartPath;
    return;
}


function renderData(data, favorites) {
    // 直近の最高点の反映
    const latestScoreArea = document.querySelector('.score-area');
    const latestBestScoreSlot = latestScoreArea.querySelectorAll(':scope > div.score > div.latest-best-score');
    const latestBestScore = data["latestDateStats"]["maxTotalScore"];
    latestBestScoreSlot[0].textContent = latestBestScore;

    // 過去最高点の反映
    const scoreArea = document.querySelector('.score-area');
    const bestScoreSlot = scoreArea.querySelectorAll(':scope > div.score > div.best-score');
    const bestScore = data["highestScore"];
    bestScoreSlot[0].textContent = bestScore;

    // top5データの反映
    const top5SongsArea = document.querySelector('.top5-songs-area');
    const songNameSlots = top5SongsArea.querySelectorAll(':scope > span > div.song-name');
    const top5SongNames = data["top5SongNames"];
    const artistNameSlots = top5SongsArea.querySelectorAll(':scope > span > div.artist-name');
    const top5ArtistNames = data["top5ArtistNames"];

    songNameSlots.forEach((songNameDiv, index) => {
        const dataItem = top5SongNames[index];

        if (dataItem !== undefined) {
            songNameDiv.textContent = dataItem;
        }
    });

    artistNameSlots.forEach((artistNameDiv, index) => {
        const dataItem = top5ArtistNames[index];

        if (dataItem !== undefined) {
            artistNameDiv.textContent = dataItem;
        }
    });

    // お気に入りデータの反映
    const favorite5SongsArea = document.querySelector('.favorite-songs-area');
    const favoriteSongNameSlots = favorite5SongsArea.querySelectorAll(':scope > span > div.song-name');
    const favorite5SongNames = favorites["favorite5SongNames"];
    const favoriteArtistNameSlots = favorite5SongsArea.querySelectorAll(':scope > span > div.artist-name');
    const favorite5ArtistNames = favorites["favorite5ArtistNames"];

    favoriteSongNameSlots.forEach((favoriteSongNameDiv, index) => {
        const dataItem = favorite5SongNames[index];

        if (dataItem !== undefined) {
            favoriteSongNameDiv.textContent = dataItem;
        }
    });

    favoriteArtistNameSlots.forEach((favoriteArtistNameDiv, index) => {
        const dataItem = favorite5ArtistNames[index];

        if (dataItem !== undefined) {
            favoriteArtistNameDiv.textContent = dataItem;
        }
    });

    // 採点記録日の反映
    const recordDaysArea = document.querySelector('.record-days');
    const recordDateSlots = recordDaysArea.querySelectorAll(':scope > span.date');
    const recordDates = data["recentDate"];

    recordDateSlots.forEach((recordDateSpan, index) => {
        const dataItem = recordDates[index];

        if (dataItem !== undefined) {
            recordDateSpan.textContent = dataItem;
        }
    });

    // 記録数の反映
    const recordCount = document.querySelector('.record-count > div.center');
    const recordCountThisYear = data["recordCountByYear"]["2025"];
    recordCount.textContent = recordCountThisYear;

    // 平均値の反映
    const avePitchValue = document.querySelector('.pitch > div.average-value');
    const avgPitch = data["latestDateStats"]["avgPitch"];
    avePitchValue.textContent = avgPitch;
    const aveStabilityValue = document.querySelector('.stability > div.average-value');
    const avgStability = data["latestDateStats"]["avgStability"];
    aveStabilityValue.textContent = avgStability;
    const aveExpressiveValue = document.querySelector('.expressive > div.average-value');
    const avgExpressive = data["latestDateStats"]["avgExpressive"];
    aveExpressiveValue.textContent = avgExpressive;
    const aveVibratoLongtoneValue = document.querySelector('.vibrato-longtone > div.average-value');
    const avgVibratoLongtone = data["latestDateStats"]["avgVibratoLongtone"];
    aveVibratoLongtoneValue.textContent = avgVibratoLongtone;
    const aveRhythmValue = document.querySelector('.rhythm > div.average-value');
    const avgRhythm = data["latestDateStats"]["avgRhythm"];
    aveRhythmValue.textContent = avgRhythm;
    const avgHearing = data["latestDateStats"]["avgHearing"];
    const aveHearingValue = document.querySelector('.hearing > div.average-value');
    aveHearingValue.textContent = avgHearing;

    // 平均チャートの反映
    updateAverageChart(data);
}


async function initApp() {
    const config = await fetchConfig();
    const favorites = await fetchFavorites();
    renderData(config, favorites);
    const data = config
    updateAverageChart(data); 
    window.addEventListener('resize', () => updateAverageChart(data));
}


initApp();