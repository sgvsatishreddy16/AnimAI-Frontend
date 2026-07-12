document.querySelectorAll('.ratio-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };
});

const generateBtn = document.getElementById('generate');
const scriptBox = document.getElementById('script');

scriptBox.oninput = () => {
    generateBtn.disabled = scriptBox.value.trim().length < 10;
};

generateBtn.onclick = async () => {
    generateBtn.disabled = true;
    generateBtn.textContent = 'Connecting to AI...';
    
    const ratio = document.querySelector('.ratio-btn.active').dataset.ratio;
    const script = scriptBox.value;
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script, ratio })
        });
        
        const data = await response.json();
        alert(data.message);
    } catch (e) {
        alert('Backend error. Check Vercel logs.');
    }
    
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Video — Coming Day 3';
};
