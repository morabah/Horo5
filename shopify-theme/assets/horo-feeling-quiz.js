/**
 * HORO Feeling Quiz
 *
 * Multi-step client-side quiz. Each question maps answers to collection handles.
 * The most frequent handle across all answers wins and becomes the result URL.
 * Progress bar updates dynamically. Supports restart.
 * Fires a custom event on completion for analytics.
 */
(function () {
  'use strict';

  function initQuiz(container) {
    var steps = container.querySelectorAll('[data-quiz-step]');
    var resultStep = container.querySelector('[data-quiz-result]');
    var progressBar = container.querySelector('[data-quiz-progress-bar]');
    var progressText = container.querySelector('[data-quiz-progress-text]');
    var progressWrap = container.querySelector('[data-quiz-progress]');
    var resultBody = container.querySelector('[data-quiz-result-body]');
    var resultCta = container.querySelector('[data-quiz-result-cta]');
    var restartBtn = container.querySelector('[data-quiz-restart]');
    var urlTemplate = container.getAttribute('data-result-url-template') || '/collections/{{ handle }}';

    var totalSteps = steps.length;
    var currentStep = 0;
    var answers = [];

    if (!steps.length || !resultStep) return;
    if (progressWrap) progressWrap.hidden = false;

    function updateProgress() {
      var pct = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
      if (progressBar) progressBar.style.width = pct + '%';
      if (progressText) progressText.textContent = (currentStep + 1) + ' / ' + totalSteps;
    }

    function showStep(index) {
      steps.forEach(function (step, i) {
        step.hidden = i !== index;
      });
      resultStep.hidden = true;
      currentStep = index;
      updateProgress();
    }

    function showResult() {
      steps.forEach(function (s) { s.hidden = true; });
      resultStep.hidden = false;
      if (progressWrap) progressWrap.hidden = true;

      // Tally most frequent handle
      var tally = {};
      var maxCount = 0;
      var winningHandle = '';
      answers.forEach(function (h) {
        tally[h] = (tally[h] || 0) + 1;
        if (tally[h] > maxCount) {
          maxCount = tally[h];
          winningHandle = h;
        }
      });
      // Tie-break: first occurrence
      if (!winningHandle && answers.length) {
        winningHandle = answers[0];
      }

      var resultUrl = urlTemplate.replace('{{ handle }}', winningHandle).replace('handle', winningHandle);
      if (resultCta) resultCta.setAttribute('href', resultUrl);
      if (resultBody) {
        resultBody.textContent = 'Based on your answers, we think you\u2019ll connect with pieces from this collection.';
      }

      // Analytics event
      try {
        window.dispatchEvent(new CustomEvent('horo:quizComplete', {
          detail: { handle: winningHandle, answers: answers }
        }));
      } catch (e) {}
    }

    function bindStep(step, index) {
      var options = step.querySelectorAll('[data-quiz-option]');
      options.forEach(function (opt) {
        opt.addEventListener('click', function () {
          var value = opt.getAttribute('data-value');
          if (value) answers[index] = value;
          if (index + 1 < totalSteps) {
            showStep(index + 1);
          } else {
            showResult();
          }
        });
      });
    }

    steps.forEach(function (step, i) {
      bindStep(step, i);
    });

    if (restartBtn) {
      restartBtn.addEventListener('click', function () {
        answers = [];
        showStep(0);
      });
    }

    showStep(0);
  }

  function init() {
    var quizzes = document.querySelectorAll('[data-feeling-quiz]');
    quizzes.forEach(initQuiz);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
