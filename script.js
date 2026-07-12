// Day 1: UI only. Day 2 we connect AI.
document.querySelectorAll('.ratio-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };
});