// 日語入門題庫，插畫由 p5.js 動態繪製。
const questionBank = [
	{ text: 'おはよう｜早安', reading: 'おはよう', icon: 'morning', color: '#ff806b' },
	{ text: 'こんにちは｜你好', reading: 'こんにちは', icon: 'hello', color: '#4bb7a7' },
	{ text: 'こんばんは｜晚上好', reading: 'こんばんは', icon: 'evening', color: '#f5bf45' },
	{ text: 'ありがとう｜謝謝', reading: 'ありがとう', icon: 'thanks', color: '#8476d8' },
	{ text: 'すみません｜不好意思', reading: 'すみません', icon: 'sorry', color: '#59a9e8' },
	{ text: 'さようなら｜再見', reading: 'さようなら', icon: 'goodbye', color: '#77b95c' },
	{ text: '本（ほん）｜書本', reading: 'ほん', icon: 'book', color: '#ff806b' },
	{ text: '水（みず）｜水', reading: 'みず', icon: 'water', color: '#4bb7a7' },
	{ text: '猫（ねこ）｜貓', reading: 'ねこ', icon: 'cat', color: '#f5bf45' },
	{ text: '学校（がっこう）｜學校', reading: 'がっこう', icon: 'school', color: '#8476d8' },
	{ text: 'りんご｜蘋果', reading: 'りんご', icon: 'apple', color: '#59a9e8' },
	{ text: '友だち（ともだち）｜朋友', reading: 'ともだち', icon: 'friend', color: '#77b95c' }
];

// 記錄目前題目文字順序、配對答案、拖曳項目與測驗狀態。
let questions = [];
let answerOrder = [];
let placements = [];
let dragging = null;
let submitted = false;
let confetti = [];
let layout = {};

// 建立全螢幕畫布，並設定頁面與觸控操作樣式。
function setup() {
	createCanvas(windowWidth, windowHeight);
	pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
	document.documentElement.style.margin = '0';
	document.documentElement.style.overflow = 'hidden';
	document.body.style.margin = '0';
	document.body.style.overflow = 'hidden';
	document.body.style.background = '#f4f8f6';
	document.body.style.touchAction = 'none';
	document.body.style.fontFamily = '"Noto Sans TC", "Microsoft JhengHei", sans-serif';
	const canvas = document.querySelector('canvas');
	canvas.style.display = 'block';
	canvas.style.touchAction = 'none';
	resetQuiz();
}

// 每一影格重新計算版面並繪製測驗畫面。
function draw() {
	layout = calculateLayout();
	background('#f4f8f6');
	drawHeader();
	drawTargets();
	drawAnswerTray();
	drawSubmitButton();
	if (submitted) drawResult();
	if (confetti.length > 0) drawConfetti();
}

// 依照視窗尺寸安排圖像題目與文字選項的位置。
function calculateLayout() {
	const compact = width < 820;
	const columns = compact ? 3 : 6;
	const maxContentWidth = Math.min(width - 28, 1260);
	const gap = compact ? 10 : 14;
	const tileWidth = Math.min((maxContentWidth - gap * (columns - 1)) / columns, compact ? 150 : 190);
	const compactTileLimit = height < 600 ? 100 : height < 740 ? 118 : 142;
	const tileHeight = compact ? Math.min(tileWidth * 1.05, compactTileLimit) : Math.min(tileWidth * 1.16, 218);
	const gridWidth = tileWidth * columns + gap * (columns - 1);
	const startX = (width - gridWidth) / 2;
	const targetTop = compact ? Math.max(88, Math.min(116, height * 0.14)) : Math.max(142, height * 0.19);
	const targetGapY = compact ? 12 : 0;
	const targetRows = Math.ceil(questions.length / columns);
	const targetBottom = targetTop + targetRows * tileHeight + (targetRows - 1) * targetGapY;
	const answerColumns = compact ? 3 : 6;
	const answerGap = compact ? 9 : 12;
	const answerWidth = Math.min((maxContentWidth - answerGap * (answerColumns - 1)) / answerColumns, compact ? 150 : 190);
	const answerHeight = compact ? 58 : 66;
	const answerGridWidth = answerWidth * answerColumns + answerGap * (answerColumns - 1);
	const answerStartX = (width - answerGridWidth) / 2;
	const answerRows = Math.ceil(questions.length / answerColumns);
	const answerGridHeight = answerRows * answerHeight + (answerRows - 1) * answerGap;
	const buttonTop = height - 59;
	const answerTop = Math.max(targetBottom + 32, Math.min(buttonTop - answerGridHeight - 22, targetBottom + (buttonTop - targetBottom - answerGridHeight) / 2));
	return {
		compact,
		columns,
		gap,
		tileWidth,
		tileHeight,
		startX,
		targetTop,
		targetGapY,
		answerColumns,
		answerGap,
		answerWidth,
		answerHeight,
		answerStartX,
		answerTop
	};
}

// 繪製標題、簡短操作提示與目前完成數量。
function drawHeader() {
	noStroke();
	fill('#193b3a');
	textAlign(LEFT, CENTER);
	textStyle(BOLD);
	textSize(width < 380 ? 17 : width < 520 ? 20 : 29);
	text('日語入門小學堂', 22, 35);
	fill('#58716d');
	textStyle(NORMAL);
	textSize(width < 520 ? 12 : 14);
	text('配對日文與中文意思，答對即可聽日語發音', 23, 65);
	const filled = placements.filter((item) => item !== null).length;
	textAlign(RIGHT, CENTER);
	textStyle(BOLD);
	textSize(13);
	fill('#54736d');
	text(`${filled} / 6 已配對`, width - 22, 35);
	textAlign(LEFT, CENTER);
	textStyle(NORMAL);
}

// 依照固定題目順序繪製六個插畫配對區。
function drawTargets() {
	for (let index = 0; index < questions.length; index += 1) {
		const position = targetPosition(index);
		drawTargetCard(index, position.x, position.y);
	}
	noStroke();
	fill('#718580');
	textAlign(LEFT, CENTER);
	textStyle(BOLD);
	textSize(12);
	text('看情境選日語', 22, layout.targetTop - 18);
}

// 計算題目卡片在響應式網格中的位置。
function targetPosition(index) {
	const column = index % layout.columns;
	const row = Math.floor(index / layout.columns);
	return {
		x: layout.startX + column * (layout.tileWidth + layout.gap),
		y: layout.targetTop + row * (layout.tileHeight + layout.targetGapY)
	};
}

// 繪製單張固定圖像卡，以及已放入的文字答案。
function drawTargetCard(index, x, y) {
	const item = questions[index];
	const answerId = placements[index];
	const isFilled = answerId !== null;
	const isCorrect = isFilled && answerId === index;
	noStroke();
	fill(255);
	rect(x, y, layout.tileWidth, layout.tileHeight, 16);
	fill(item.color);
	rect(x + 7, y + 7, layout.tileWidth - 14, layout.tileHeight - 14, 12);
	drawIllustration(item.icon, x + layout.tileWidth / 2, y + layout.tileHeight * 0.43, Math.min(layout.tileWidth * 0.66, 104));
	if (isFilled) {
		fill(isCorrect ? '#174b3b' : '#80483e');
		textAlign(CENTER, CENTER);
		textStyle(BOLD);
		textSize(layout.compact ? 9.5 : 13);
		text(questions[answerId].text.split('｜')[0], x + 7, y + layout.tileHeight - 25, layout.tileWidth - 14, 21);
	} else {
		noFill();
		stroke(255, 220);
		strokeWeight(1.5);
		drawingContext.setLineDash([5, 5]);
		rect(x + 8, y + layout.tileHeight - 30, layout.tileWidth - 16, 22, 8);
		drawingContext.setLineDash([]);
		noStroke();
		fill(255, 235);
		textAlign(CENTER, CENTER);
		textStyle(NORMAL);
		textSize(10);
		text('拖曳到這裡', x + 8, y + layout.tileHeight - 29, layout.tileWidth - 16, 20);
	}
	if (dragging && dragging.source === 'target' && dragging.index === index) {
		fill(255, 105);
		rect(x, y, layout.tileWidth, layout.tileHeight, 16);
	}
}

// 畫出六個可拖曳文字選項，已放入題目的文字不重複顯示。
function drawAnswerTray() {
	noStroke();
	fill('#718580');
	textAlign(LEFT, CENTER);
	textStyle(BOLD);
	textSize(12);
	text('拖曳文字', 22, layout.answerTop - 17);
	for (let orderIndex = 0; orderIndex < answerOrder.length; orderIndex += 1) {
		const questionId = answerOrder[orderIndex];
		if (placements.includes(questionId) || isCurrentlyDragged(questionId)) continue;
		const position = answerPosition(orderIndex);
		drawAnswerChip(questionId, position.x, position.y, false);
	}
	if (dragging && dragging.source === 'tray') {
		drawAnswerChip(dragging.questionId, mouseX - dragging.offsetX, mouseY - dragging.offsetY, true);
	}
	if (dragging && dragging.source === 'target') {
		drawAnswerChip(dragging.questionId, mouseX - dragging.offsetX, mouseY - dragging.offsetY, true);
	}
}

// 計算文字選項在下方網格中的位置。
function answerPosition(orderIndex) {
	const column = orderIndex % layout.answerColumns;
	const row = Math.floor(orderIndex / layout.answerColumns);
	return {
		x: layout.answerStartX + column * (layout.answerWidth + layout.answerGap),
		y: layout.answerTop + row * (layout.answerHeight + layout.answerGap)
	};
}

// 繪製一個文字選項，拖曳中的選項會略微放大並加上陰影。
function drawAnswerChip(questionId, x, y, active) {
	const item = questions[questionId];
	drawingContext.save();
	if (active) {
		drawingContext.shadowColor = 'rgba(24, 58, 55, 0.22)';
		drawingContext.shadowBlur = 14;
		drawingContext.shadowOffsetY = 5;
	}
	stroke(active ? item.color : '#d8e2de');
	strokeWeight(active ? 2 : 1);
	fill(255);
	rect(x, y, layout.answerWidth, layout.answerHeight, 12);
	drawingContext.restore();
	noStroke();
	fill('#274542');
	textAlign(CENTER, CENTER);
	textStyle(BOLD);
	textSize(layout.compact ? 10 : 12);
	const answerParts = item.text.split('｜');
	text(answerParts[0], x + 6, y + 3, layout.answerWidth - 12, layout.answerHeight / 2);
	text(answerParts[1], x + 6, y + layout.answerHeight / 2 - 2, layout.answerWidth - 12, layout.answerHeight / 2);
}

// 確認某個文字答案目前是否正被拖曳。
function isCurrentlyDragged(questionId) {
	return dragging && dragging.questionId === questionId;
}

// 繪製尚未交卷或已交卷後的主要按鈕。
function drawSubmitButton() {
	const button = submitButtonBounds();
	const ready = placements.every((item) => item !== null);
	const label = submitted ? '再玩一次' : '交卷看成績';
	noStroke();
	fill(submitted ? '#193f3c' : ready ? '#193f3c' : '#a9bbb5');
	rect(button.x, button.y, button.w, button.h, 14);
	fill(255);
	textAlign(CENTER, CENTER);
	textStyle(BOLD);
	textSize(15);
	text(label, button.x, button.y, button.w, button.h);
}

// 計算底部按鈕的位置與尺寸。
function submitButtonBounds() {
	const buttonWidth = Math.min(width - 40, 260);
	return { x: (width - buttonWidth) / 2, y: height - 59, w: buttonWidth, h: 44 };
}

// 交卷後顯示得分與鼓勵文字。
function drawResult() {
	const correctCount = placements.filter((answer, index) => answer === index).length;
	const score = Math.round((correctCount / questions.length) * 100);
	fill(15, 42, 39, 150);
	rect(0, 0, width, height);
	const panelWidth = Math.min(width - 36, 380);
	const panelHeight = 232;
	const panelX = (width - panelWidth) / 2;
	const panelY = (height - panelHeight) / 2;
	noStroke();
	fill('#fffdf7');
	rect(panelX, panelY, panelWidth, panelHeight, 22);
	fill('#193b3a');
	textAlign(CENTER, CENTER);
	textStyle(BOLD);
	textSize(19);
	text(score >= 80 ? '太棒了！日語入門達人' : '日語挑戰完成！', width / 2, panelY + 48);
	fill('#ff806b');
	textSize(54);
	text(`${score}%`, width / 2, panelY + 112);
	fill('#58716d');
	textStyle(NORMAL);
	textSize(14);
	text(`${correctCount} 題答對，共 6 題`, width / 2, panelY + 166);
	text(score >= 80 ? '彩帶為你慶祝！' : '再練習一次，會更熟悉喔！', width / 2, panelY + 194);
}

// 按照題目類型繪製日語入門詞彙插畫。
function drawIllustration(icon, centerX, centerY, size) {
	push();
	translate(centerX, centerY);
	translate(0, Math.sin(frameCount * 0.055) * 2);
	if (icon === 'morning') drawSunIcon(size);
	if (icon === 'hello') drawGreetingScene(size, 'こんにちは');
	if (icon === 'goodbye') drawGreetingScene(size, 'さようなら');
	if (icon === 'friend') drawGreetingScene(size, 'ともだち');
	if (icon === 'evening') drawMoonIcon(size);
	if (icon === 'thanks') drawThanksScene(size);
	if (icon === 'sorry') drawSorryScene(size);
	if (icon === 'book') drawBookIcon(size);
	if (icon === 'water') drawWaterDrop(size);
	if (icon === 'cat') drawCatIcon(size);
	if (icon === 'school') drawSchoolIcon(size);
	if (icon === 'apple') drawAppleIcon(size);
	pop();
}

// 繪製代表早晨問候的太陽圖示。
function drawSunIcon(size) {
	noStroke();
	fill('#ffc95a');
	ellipse(0, 0, size * 0.38);
	stroke('#f3a64a');
	strokeWeight(size * 0.035);
	for (let ray = 0; ray < 8; ray += 1) {
		const angle = ray * TWO_PI / 8;
		line(Math.cos(angle) * size * 0.27, Math.sin(angle) * size * 0.27, Math.cos(angle) * size * 0.4, Math.sin(angle) * size * 0.4);
	}
}

// 繪製書本圖示，書頁會隨動畫輕輕翻動。
function drawBookIcon(size) {
	const pageTilt = Math.sin(frameCount * 0.06) * size * 0.025;
	noStroke();
	fill('#fff6de');
	stroke('#4b86c5');
	strokeWeight(2);
	quad(-size * 0.38, -size * 0.25, -pageTilt, -size * 0.18, -pageTilt, size * 0.3, -size * 0.38, size * 0.23);
	quad(pageTilt, -size * 0.18, size * 0.38, -size * 0.25, size * 0.38, size * 0.23, pageTilt, size * 0.3);
	line(0, -size * 0.17, 0, size * 0.3);
	noStroke();
	fill('#e98973');
	rect(-size * 0.39, -size * 0.3, size * 0.12, size * 0.56, 4);
}

// 繪製水滴圖示，水面會隨動畫微微起伏。
function drawWaterDrop(size) {
	const ripple = Math.sin(frameCount * 0.1) * size * 0.02;
	noStroke();
	fill('#4aa9d3');
	ellipse(0, size * 0.08, size * 0.36, size * 0.42);
	triangle(-size * 0.18, size * 0.02, size * 0.18, size * 0.02, 0, -size * 0.38);
	fill('#d9f7ff');
	ellipse(-size * 0.07, size * 0.12 + ripple, size * 0.07, size * 0.12);
}

// 繪製晚上好題目的月亮與星星。
function drawMoonIcon(size) {
	noStroke();
	fill('#fff0a8');
	ellipse(-size * 0.05, 0, size * 0.48);
	fill('#f5bf45');
	ellipse(size * 0.09, -size * 0.1, size * 0.42);
	fill('#fffdf5');	ellipse(-size * 0.36, -size * 0.25, size * 0.07);
	ellipse(size * 0.34, size * 0.2, size * 0.06);
}

// 繪製貓咪臉部，代表「ねこ」這個單字。
function drawCatIcon(size) {
	noStroke();
	fill('#f3b27e');
	triangle(-size * 0.34, -size * 0.05, -size * 0.29, -size * 0.4, -size * 0.04, -size * 0.24);
	triangle(size * 0.34, -size * 0.05, size * 0.29, -size * 0.4, size * 0.04, -size * 0.24);
	ellipse(0, size * 0.02, size * 0.62, size * 0.56);
	fill('#39413f');
	ellipse(-size * 0.12, -size * 0.01, size * 0.045, size * 0.07);
	ellipse(size * 0.12, -size * 0.01, size * 0.045, size * 0.07);
	fill('#ed8b88');
	triangle(-size * 0.045, size * 0.1, size * 0.045, size * 0.1, 0, size * 0.16);
	stroke('#8d7565');
	strokeWeight(1.5);
	line(-size * 0.15, size * 0.12, -size * 0.32, size * 0.08);
	line(size * 0.15, size * 0.12, size * 0.32, size * 0.08);
}

// 繪製有窗戶與入口的學校建築。
function drawSchoolIcon(size) {
	noStroke();
	fill('#f3b27e');
	triangle(-size * 0.42, -size * 0.14, 0, -size * 0.43, size * 0.42, -size * 0.14);
	fill('#fff4df');
	rect(-size * 0.34, -size * 0.15, size * 0.68, size * 0.5, 5);
	fill('#63a9bd');
	rect(-size * 0.24, -size * 0.07, size * 0.14, size * 0.14, 2);
	rect(size * 0.1, -size * 0.07, size * 0.14, size * 0.14, 2);
	fill('#e98973');
	rect(-size * 0.07, size * 0.12, size * 0.14, size * 0.23, 3);
	fill('#fffdf5');
	rect(-size * 0.11, -size * 0.32, size * 0.22, size * 0.1, 3);
}

// 繪製蘋果與葉子，代表「りんご」這個單字。
function drawAppleIcon(size) {
	const wobble = Math.sin(frameCount * 0.07) * 0.025;
	push();
	rotate(wobble);
	noStroke();
	fill('#ed6658');
	ellipse(0, size * 0.08, size * 0.56, size * 0.48);
	ellipse(-size * 0.13, size * 0.02, size * 0.31, size * 0.31);
	ellipse(size * 0.13, size * 0.02, size * 0.31, size * 0.31);
	fill('#68a94f');
	ellipse(size * 0.12, -size * 0.25, size * 0.2, size * 0.09);
	stroke('#8d7565');
	strokeWeight(3);
	line(0, -size * 0.23, size * 0.02, -size * 0.34);
	pop();
}

// 設定滑鼠或觸控開始時抓取的文字或已放置答案。
function mousePressed() {
	if (submitted) return;
	if (pointInBounds(mouseX, mouseY, submitButtonBounds())) return;
	for (let index = questions.length - 1; index >= 0; index -= 1) {
		const target = targetPosition(index);
		if (placements[index] !== null && pointInRect(mouseX, mouseY, target.x, target.y, layout.tileWidth, layout.tileHeight)) {
			const questionId = placements[index];
			placements[index] = null;
			startDragging(questionId, 'target', index, mouseX - target.x, mouseY - target.y);
			return;
		}
	}
	for (let orderIndex = 0; orderIndex < answerOrder.length; orderIndex += 1) {
		const questionId = answerOrder[orderIndex];
		if (placements.includes(questionId)) continue;
		const answer = answerPosition(orderIndex);
		if (pointInRect(mouseX, mouseY, answer.x, answer.y, layout.answerWidth, layout.answerHeight)) {
			startDragging(questionId, 'tray', orderIndex, mouseX - answer.x, mouseY - answer.y);
			return;
		}
	}
}

// 記錄拖曳項目與游標相對於卡片的抓取位置。
function startDragging(questionId, source, index, offsetX, offsetY) {
	dragging = { questionId, source, index, offsetX, offsetY };
}

// 放開滑鼠或手指時，把文字放到相符的圖像卡上。
function mouseReleased() {
	if (!dragging) return;
	const dropIndex = questions.findIndex((item, index) => {
		const target = targetPosition(index);
		return pointInRect(mouseX, mouseY, target.x, target.y, layout.tileWidth, layout.tileHeight);
	});
	if (dropIndex !== -1) {
		placements[dropIndex] = dragging.questionId;
		if (dropIndex === dragging.questionId) playCorrectFeedback(dragging.questionId);
	}
	dragging = null;
}

// 觸控開始時使用相同的卡片命中邏輯，並阻止手機頁面跟著滑動。
function touchStarted() {
	if (touches.length > 0) {
		mouseX = touches[0].x;
		mouseY = touches[0].y;
		mousePressed();
	}
	return false;
}

// 手指移動時更新拖曳座標，讓答案卡能跟隨手指。
function touchMoved() {
	if (dragging && touches.length > 0) {
		mouseX = touches[0].x;
		mouseY = touches[0].y;
	}
	return false;
}

// 手指放開時完成配對或觸發底部按鈕。
function touchEnded(event) {
	const releasedTouch = event && event.changedTouches && event.changedTouches[0];
	if (releasedTouch) {
		const canvasBounds = document.querySelector('canvas').getBoundingClientRect();
		mouseX = (releasedTouch.clientX - canvasBounds.left) * width / canvasBounds.width;
		mouseY = (releasedTouch.clientY - canvasBounds.top) * height / canvasBounds.height;
	}
	if (pointInBounds(mouseX, mouseY, submitButtonBounds())) {
		handleSubmitButton();
	} else {
		mouseReleased();
	}
	return false;
}

// 答對時播放提示音，並使用瀏覽器日語語音朗讀詞句。
function playCorrectFeedback(questionId) {
	const AudioContextClass = window.AudioContext || window.webkitAudioContext;
	if (AudioContextClass) {
		const audioContext = new AudioContextClass();
		const oscillator = audioContext.createOscillator();
		const volume = audioContext.createGain();
		const startTime = audioContext.currentTime;
		oscillator.type = 'sine';
		oscillator.frequency.setValueAtTime(660, startTime);
		oscillator.frequency.setValueAtTime(880, startTime + 0.12);
		volume.gain.setValueAtTime(0.12, startTime);
		volume.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
		oscillator.connect(volume);
		volume.connect(audioContext.destination);
		oscillator.onended = () => audioContext.close();
		oscillator.start(startTime);
		oscillator.stop(startTime + 0.3);
	}
	if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
		const pronunciation = new SpeechSynthesisUtterance(questions[questionId].reading);
		pronunciation.lang = 'ja-JP';
		pronunciation.rate = 0.85;
		window.speechSynthesis.cancel();
		window.speechSynthesis.speak(pronunciation);
	}
}
// 繪製兩人揮手交談的打招呼情境。
function drawGreetingScene(size, phrase) {
	drawPerson(-size * 0.23, size * 0.35, size * 0.58, 'wave', '#4b9d91');
	drawPerson(size * 0.23, size * 0.35, size * 0.58, 'open', '#ee9b78');
	noStroke();
	fill('#fffdf5');
	ellipse(size * 0.3, -size * 0.34, size * 0.62, size * 0.24);
	fill('#4b9d91');
	textAlign(CENTER, CENTER);
	textStyle(BOLD);
	textSize(size * 0.09);
	text(phrase, size * 0.3, -size * 0.34);
}

// 繪製遞上禮物並致意的謝謝情境。
function drawThanksScene(size) {
	drawPerson(-size * 0.24, size * 0.35, size * 0.57, 'open', '#438fbd');
	drawPerson(size * 0.24, size * 0.35, size * 0.57, 'bow', '#ef9d69');
	noStroke();
	fill('#f5bf45');
	rect(-size * 0.12, size * 0.02, size * 0.24, size * 0.21, 3);
	fill('#fff4d8');
	rect(-size * 0.025, size * 0.02, size * 0.05, size * 0.21);
	rect(-size * 0.12, size * 0.09, size * 0.24, size * 0.045);
	fill('#ff806b');
	ellipse(size * 0.3, -size * 0.42, size * 0.09);
	ellipse(size * 0.37, -size * 0.42, size * 0.09);
	triangle(size * 0.255, -size * 0.4, size * 0.415, -size * 0.4, size * 0.335, -size * 0.27);
}

// 繪製一人合掌道歉、另一人驚訝的情境。
function drawSorryScene(size) {
	drawPerson(-size * 0.23, size * 0.35, size * 0.58, 'clasp', '#8d79bf');
	drawPerson(size * 0.23, size * 0.35, size * 0.58, 'surprised', '#e79b68');
	noStroke();
	fill('#65a9d2');
	ellipse(-size * 0.38, -size * 0.36, size * 0.06, size * 0.1);
	triangle(-size * 0.41, -size * 0.35, -size * 0.35, -size * 0.35, -size * 0.38, -size * 0.43);
	fill('#f5bf45');
	textAlign(CENTER, CENTER);
	textStyle(BOLD);
	textSize(size * 0.17);
	text('!', size * 0.42, -size * 0.4);
}

// 依照姿勢繪製人物，讓不同日語用語的肢體語言一目了然。
function drawPerson(x, y, personSize, pose, shirtColor) {
	push();
	translate(x, y);
	if (pose === 'bow') rotate(0.3);
	noStroke();
	fill('#f3c49e');
	ellipse(0, -personSize * 0.3, personSize * 0.25, personSize * 0.25);
	fill('#594a43');
	ellipse(0, -personSize * 0.39, personSize * 0.26, personSize * 0.1);
	fill(shirtColor);
	rect(-personSize * 0.15, -personSize * 0.16, personSize * 0.3, personSize * 0.35, personSize * 0.07);
	stroke('#f3c49e');
	strokeWeight(personSize * 0.055);
	if (pose === 'wave') {
		line(personSize * 0.1, -personSize * 0.1, personSize * 0.25, -personSize * 0.34);
		line(-personSize * 0.1, -personSize * 0.1, -personSize * 0.19, personSize * 0.06);
		noStroke();
		fill('#f3c49e');
		ellipse(personSize * 0.26, -personSize * 0.36, personSize * 0.09);
	} else if (pose === 'clasp') {
		line(-personSize * 0.11, -personSize * 0.1, 0, personSize * 0.02);
		line(personSize * 0.11, -personSize * 0.1, 0, personSize * 0.02);
		noStroke();
		fill('#f3c49e');
		ellipse(0, personSize * 0.02, personSize * 0.08, personSize * 0.12);
	} else if (pose === 'surprised') {
		line(-personSize * 0.11, -personSize * 0.1, -personSize * 0.2, -personSize * 0.25);
		line(personSize * 0.11, -personSize * 0.1, personSize * 0.2, -personSize * 0.25);
	} else {
		line(-personSize * 0.11, -personSize * 0.1, -personSize * 0.2, personSize * 0.04);
		line(personSize * 0.11, -personSize * 0.1, personSize * 0.2, personSize * 0.04);
	}
	stroke('#48504e');
	strokeWeight(personSize * 0.045);
	line(-personSize * 0.07, personSize * 0.19, -personSize * 0.09, personSize * 0.34);
	line(personSize * 0.07, personSize * 0.19, personSize * 0.09, personSize * 0.34);
	noStroke();
	fill('#39413f');
	ellipse(-personSize * 0.045, -personSize * 0.3, personSize * 0.025);
	ellipse(personSize * 0.045, -personSize * 0.3, personSize * 0.025);
	if (pose === 'surprised') {
		fill('#ed8b88');
		ellipse(0, -personSize * 0.24, personSize * 0.04, personSize * 0.055);
	} else {
		noFill();
		stroke('#9b5b54');
		strokeWeight(personSize * 0.018);
		arc(0, -personSize * 0.25, personSize * 0.07, personSize * 0.05, 0, PI);
	}
	pop();
}

// 檢查座標是否落在指定的矩形區域。
function pointInRect(pointX, pointY, x, y, rectWidth, rectHeight) {
	return pointX >= x && pointX <= x + rectWidth && pointY >= y && pointY <= y + rectHeight;
}

// 檢查座標是否落在按鈕範圍內。
function pointInBounds(pointX, pointY, bounds) {
	return pointInRect(pointX, pointY, bounds.x, bounds.y, bounds.w, bounds.h);
}

// 按下交卷顯示成績，達到八十分時啟動彩帶動畫。
function mouseClicked() {
	if (!pointInBounds(mouseX, mouseY, submitButtonBounds())) return;
	handleSubmitButton();
}

// 共用滑鼠與觸控的交卷、重玩按鈕處理。
function handleSubmitButton() {
	if (submitted) {
		resetQuiz();
		return;
	}
	if (!placements.every((item) => item !== null)) return;
	submitted = true;
	const score = placements.filter((answer, index) => answer === index).length / questions.length * 100;
	if (score >= 80) createConfetti();
}

// 洗牌選項並清空答案，準備新一輪測驗。
function resetQuiz() {
	const previousQuestionTexts = new Set(questions.map((question) => question.text));
	const shuffledBank = shuffleArray(questionBank);
	questions = shuffledBank.slice(0, 6);
	if (questions.every((question) => previousQuestionTexts.has(question.text))) {
		questions = shuffledBank.slice(6, 12);
	}
	answerOrder = shuffleArray(questions.map((question, index) => index));
	placements = Array(questions.length).fill(null);
	dragging = null;
	submitted = false;
	confetti = [];
}

// 複製陣列後使用 Fisher-Yates 演算法打亂順序。
function shuffleArray(items) {
	const shuffledItems = items.slice();
	for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex], shuffledItems[index]];
	}
	return shuffledItems;
}

// 為高分結果建立彩色紙片與彩帶粒子。
function createConfetti() {
	const colors = ['#ff806b', '#f5bf45', '#4bb7a7', '#8476d8', '#59a9e8', '#77b95c'];
	for (let index = 0; index < 130; index += 1) {
		confetti.push({
			x: random(width),
			y: random(-height, 0),
			speed: random(2, 6),
			drift: random(-1.5, 1.5),
			angle: random(TWO_PI),
			spin: random(-0.08, 0.08),
			size: random(5, 11),
			color: random(colors)
		});
	}
}

// 更新並繪製持續飄落的彩帶紙片。
function drawConfetti() {
	for (let index = confetti.length - 1; index >= 0; index -= 1) {
		const piece = confetti[index];
		piece.y += piece.speed;
		piece.x += piece.drift + Math.sin(frameCount * 0.04 + index) * 0.6;
		piece.angle += piece.spin;
		push();
		translate(piece.x, piece.y);
		rotate(piece.angle);
		noStroke();
		fill(piece.color);
		rect(-piece.size / 2, -piece.size / 3, piece.size, piece.size * 0.55, 2);
		pop();
		if (piece.y > height + 20) confetti.splice(index, 1);
	}
}

// 視窗尺寸改變時同步調整全螢幕畫布。
function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}
