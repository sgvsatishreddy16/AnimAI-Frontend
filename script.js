document.querySelectorAll('.ratio-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };
});

const generateBtn = document.getElementById('generate');
const scriptBox = document.getElementById('script');
const resultDiv = document.getElementById('result') || createResultDiv();

function createResultDiv() {
    const div = document.createElement('div');
    div.id = 'result';
    div.style.marginTop = '20px';
    document.querySelector('.container').appendChild(div);
    return div;
}

scriptBox.oninput = () => {
    generateBtn.disabled = scriptBox.value.trim().length < 20;
};

generateBtn.onclick = async () => {
    generateBtn.disabled = true;
    generateBtn.textContent = 'AI is cooking... 30-60 sec';
    resultDiv.innerHTML = '<p>Generating Ghibli scenes + Telugu voice...</p>';
    
    const ratio = document.querySelector('.ratio-btn.active').dataset.ratio;
    const script = scriptBox.value;
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script, ratio })
        });
        
        const data = await response.json();
        
        if (data.error) throw new Error(data.details);
        
        // Show results
        resultDiv.innerHTML = `
            <h3>Done in ${data.time_taken}! Used ~${data.credits_used} credits</h3>
            <audio controls src="${data.audio}" style="width:100%;margin:10px 0;"></audio>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;">
                ${data.images.map(url => `<img src="${url}" style="width:100%;border-radius:8px;">`).join('')}
            </div>
            <p style="margin-top:10px;font-size:12px;opacity:0.7;">Day 4: We'll stitch these into 1 video file</p>
        `;
        
    } catch (e) {
        resultDiv.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`;
    }
    
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Another';
};
