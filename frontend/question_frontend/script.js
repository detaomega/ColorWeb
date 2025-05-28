// 遊戲數據
        const animeData = [
            {
                name: "鬼滅之刃",
                images: [
                    "/api/placeholder/400/320", // 模糊版本
                    "/api/placeholder/400/320", // 中等清晰度
                    "/api/placeholder/400/320", // 較清晰版本
                    "/api/placeholder/400/320"  // 最清晰版本
                ]
            },
            {
                name: "進擊的巨人",
                images: [
                    "/api/placeholder/400/320",
                    "/api/placeholder/400/320",
                    "/api/placeholder/400/320",
                    "/api/placeholder/400/320"
                ]
            },
            {
                name: "海賊王",
                images: [
                    "/api/placeholder/400/320",
                    "/api/placeholder/400/320",
                    "/api/placeholder/400/320",
                    "/api/placeholder/400/320"
                ]
            },
            {
                name: "火影忍者",
                images: [
                    "/api/placeholder/400/320",
                    "/api/placeholder/400/320",
                    "/api/placeholder/400/320",
                    "/api/placeholder/400/320"
                ]
            },
            {
                name: "七龍珠",
                images: [
                    "/api/placeholder/400/320",
                    "/api/placeholder/400/320",
                    "/api/placeholder/400/320",
                    "/api/placeholder/400/320"
                ]
            }
        ];

        // 遊戲變數
        let currentQuestion = 0;
        let score = 0;
        let timeLeft = 60;
        let timerInterval;
        let hintCount = 0;
        let currentHintLevel = 0;
        
        // DOM 元素
        const startContainer = document.getElementById('startContainer');
        const gameContainer = document.getElementById('gameContainer');
        const gameOverContainer = document.getElementById('gameOverContainer');
        const questionNumberElement = document.getElementById('questionNumber');
        const scoreElement = document.getElementById('score');
        const timeLeftElement = document.getElementById('timeLeft');
        const animeImageElement = document.getElementById('animeImage');
        const hintBtnElement = document.getElementById('hintBtn');
        const hintCountElement = document.getElementById('hintCount');
        const answerInputElement = document.getElementById('answerInput');
        const answerLengthElement = document.getElementById('answerLength');
        const submitBtnElement = document.getElementById('submitBtn');
        const resultMessageElement = document.getElementById('resultMessage');
        const finalScoreElement = document.getElementById('finalScore');
        const restartBtnElement = document.getElementById('restartBtn');
        const startBtnElement = document.getElementById('startBtn');
        const loadingIndicatorElement = document.getElementById('loadingIndicator');
        
        // 開始按鈕事件監聽
        startBtnElement.addEventListener('click', startGame);
        
        // 重新開始按鈕事件監聽
        restartBtnElement.addEventListener('click', startGame);
        
        // 提示按鈕事件監聽
        hintBtnElement.addEventListener('click', () => {
            if (hintCount > 0) {
                hintCount--;
                currentHintLevel++;
                hintCountElement.textContent = hintCount;
                
                if (currentHintLevel >= animeData[currentQuestion].images.length) {
                    currentHintLevel = animeData[currentQuestion].images.length - 1;
                }
                
                // 顯示加載指示器
                loadingIndicatorElement.style.display = 'block';
                
                // 更換圖片
                animeImageElement.src = animeData[currentQuestion].images[currentHintLevel];
                
                // 圖片加載完成後隱藏加載指示器
                animeImageElement.onload = () => {
                    loadingIndicatorElement.style.display = 'none';
                };
                
                // 如果用完提示，禁用按鈕
                if (hintCount === 0) {
                    hintBtnElement.disabled = true;
                }
            }
        });
        
        // 提交按鈕事件監聽
        submitBtnElement.addEventListener('click', checkAnswer);
        
        // 輸入框按Enter提交
        answerInputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkAnswer();
            }
        });
        
        // 開始遊戲
        function startGame() {
            // 重置遊戲變數
            currentQuestion = 0;
            score = 0;
            timeLeft = 60;
            hintCount = 0;
            currentHintLevel = 0;
            
            // 更新UI
            scoreElement.textContent = score;
            questionNumberElement.textContent = currentQuestion + 1;
            
            // 切換容器顯示
            startContainer.style.display = 'none';
            gameOverContainer.style.display = 'none';
            gameContainer.style.display = 'block';
            
            // 加載第一題
            loadQuestion();
            
            // 開始計時
            startTimer();
        }
        
        // 加載問題
        function loadQuestion() {
            // 清空輸入框和結果消息
            answerInputElement.value = '';
            resultMessageElement.textContent = '';
            resultMessageElement.className = 'result-message';
            
            // 重置計時器和提示
            timeLeft = 60;
            timeLeftElement.textContent = timeLeft;
            hintCount = 0;
            currentHintLevel = 0;
            hintCountElement.textContent = hintCount;
            hintBtnElement.disabled = true;
            
            // 顯示問題編號
            questionNumberElement.textContent = currentQuestion + 1;
            
            // 顯示答案長度
            answerLengthElement.textContent = animeData[currentQuestion].name.length;
            
            // 加載初始圖片
            loadingIndicatorElement.style.display = 'block';
            animeImageElement.src = animeData[currentQuestion].images[0];
            animeImageElement.onload = () => {
                loadingIndicatorElement.style.display = 'none';
            };
            
            // 重新開始計時器
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            startTimer();
        }
        
        // 開始計時器
        function startTimer() {
            timerInterval = setInterval(() => {
                timeLeft--;
                timeLeftElement.textContent = timeLeft;
                
                // 每10秒增加一次提示機會
                if (timeLeft % 10 === 0 && timeLeft > 0) {
                    hintCount++;
                    hintCountElement.textContent = hintCount;
                    hintBtnElement.disabled = false;
                }
                
                // 時間到
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    resultMessageElement.textContent = `時間到！正確答案是：${animeData[currentQuestion].name}`;
                    resultMessageElement.className = 'result-message incorrect';
                    
                    // 延遲後進入下一題或結束遊戲
                    setTimeout(() => {
                        nextQuestion();
                    }, 2000);
                }
            }, 1000);
        }
        
        // 檢查答案
        function checkAnswer() {
            const userAnswer = answerInputElement.value.trim();
            const correctAnswer = animeData[currentQuestion].name;
            
            if (userAnswer === correctAnswer) {
                // 答案正確
                clearInterval(timerInterval);
                score++;
                scoreElement.textContent = score;
                resultMessageElement.textContent = '答對了！';
                resultMessageElement.className = 'result-message correct';
                
                // 延遲後進入下一題
                setTimeout(() => {
                    nextQuestion();
                }, 1000);
            } else {
                // 答案錯誤，顯示震動效果
                answerInputElement.classList.add('shake');
                setTimeout(() => {
                    answerInputElement.classList.remove('shake');
                }, 500);
                
                resultMessageElement.textContent = '答錯了，請再試一次！';
                resultMessageElement.className = 'result-message incorrect';
            }
        }
        
        // 進入下一題或結束遊戲
        function nextQuestion() {
            currentQuestion++;
            
            if (currentQuestion < animeData.length) {
                // 進入下一題
                loadQuestion();
            } else {
                // 遊戲結束
                clearInterval(timerInterval);
                gameContainer.style.display = 'none';
                gameOverContainer.style.display = 'flex';
                finalScoreElement.textContent = score;
            }
        }