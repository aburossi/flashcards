<script>
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.reveal-button').forEach(button => {
    button.addEventListener('click', () => {
      const answer = button.nextElementSibling;
      if (answer) {
        answer.style.display = 'block';
        button.style.display = 'none';
        setTimeout(() => {
          if (Reveal && Reveal.layout) {
            Reveal.layout();
          }
        }, 150);
      }
    });
  });
});
</script>