<script>
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal-button').forEach(button => {
    button.addEventListener('click', () => {
      const answer = button.nextElementSibling;
      if (answer) {
        answer.style.display = 'block';
        button.style.display = 'none';

        // 🛠️ Wichtig: Layout neu berechnen, damit Reveal.js die Slide-Größe anpasst
        setTimeout(() => {
          if (Reveal && Reveal.layout) {
            Reveal.layout();
          }
        }, 150); // kurz warten, damit CSS wirken kann
      }
    });
  });
});
</script>
