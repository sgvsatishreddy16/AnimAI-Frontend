let ffmpegLoaded = false;
let ffmpegInstance = null;

// Load FFmpeg library first, then setup everything else
const ffmpegScript = document.createElement('script');
ffmpegScript.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js';
ffmpegScript.onload = () => {
    ffmpegLoaded = true;
    console.log('FFmpeg loaded');
};
document.head.appendChild(ffmpegScript);

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
    generateBtn.disabled = scriptBox.value.trim().length < 30;
};

generateBtn.onclick = async () => {
    if (!ffmpegLoaded) {
        resultDiv.innerHTML = '<p style="color:orange;">Loading video tools... try again in 5 seconds.</p>';
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = 'Step 1/3: Generating scenes...';
    resultDiv.innerHTML = '<p>Creating Ghibli images + English voice...</p>';

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

        generateBtn.textContent = 'Step 2/3: Starting video editor...';

        // Initialize FFmpeg only once
        if (!ffmpegInstance) {
            const { createFFmpeg, fetchFile } = FFmpeg;
            ffmpegInstance = createFFmpeg({ log: false });
            await ffmpegInstance.load();
        }
        const ffmpeg = ffmpegInstance;
        const { fetchFile } = FFmpeg;

        generateBtn.textContent = 'Step 3/3: Rendering MP4... 30-60s';
        resultDiv.innerHTML = '<p>Stitching video in your browser. Keep this tab open...</p>';

        // Download images
        for (let i = 0; i < data.images.length; i++) {
            ffmpeg.FS('writeFile', `img${i}.jpg`, await fetchFile(data.images[i]));
        }

        // Download + join audio chunks
        for (let i = 0; i < data.audio_urls.length; i++) {
            ffmpeg.FS('writeFile', `audio${i}.mp3`, await fetchFile(data.audio_urls[i]));
        }
        const audioList = data.audio_urls.map((_, i) => `file 'audio${i}.mp3'`).join('\n');
        ffmpeg.FS('writeFile', 'audiolist.txt', audioList);
        await ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'audiolist.txt', '-c', 'copy', 'audio.mp3');

        // Make video: 3 sec per image + full audio
        await ffmpeg.run('-r', '1/3', '-i', 'img%d.jpg', '-i', 'audio.mp3', '-c:v', 'libx264', '-c:a', 'aac', '-shortest', '-pix_fmt', 'yuv420p', 'output.mp4');

        const videoData = ffmpeg.FS('readFile', 'output.mp4');
        const videoUrl = URL.createObjectURL(new Blob([videoData.buffer], { type: 'video/mp4' }));

        resultDiv.innerHTML = `
            <h3>✅ Video ready — 100% free!</h3>
            <video controls src="${videoUrl}" style="width:100%;max-width:400px;border-radius:8px;"></video>
            <a href="${videoUrl}" download="animai-english-scene.mp4" style="display:block;margin-top:10px;padding:12px;background:#e91e63;color:white;text-align:center;border-radius:8px;text-decoration:none;">Download MP4</a>
            <p style="margin-top:10px;font-size:12px;opacity:0.7;">Voice: Google US English. Images: Pollinations. Cost: $0</p>
        `;

    } catch (e) {
        resultDiv.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`;
    }

    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate Another';
};
