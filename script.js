import { FFmpeg } from 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js';
import { fetchFile } from 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js';

const ffmpeg = new FFmpeg();
let ffmpegReady = false;

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

async function loadFFmpeg() {
    if (ffmpegReady) return;
    generateBtn.textContent = 'Loading video engine...';
    generateBtn.disabled = true;

    ffmpeg.on('log', ({ message }) => console.log(message));

    await ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js'
    });

    ffmpegReady = true;
    generateBtn.textContent = 'Generate Video';
    generateBtn.disabled = scriptBox.value.trim().length < 30;
}

generateBtn.onclick = async () => {
    await loadFFmpeg();

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

        generateBtn.textContent = 'Step 2/3: Downloading assets...';

        // Download images
        for (let i = 0; i < data.images.length; i++) {
            await ffmpeg.writeFile(`img${i}.jpg`, await fetchFile(data.images[i]));
        }

        // Download + join audio chunks
        for (let i = 0; i < data.audio_urls.length; i++) {
            await ffmpeg.writeFile(`audio${i}.mp3`, await fetchFile(data.audio_urls[i]));
        }
        const audioList = data.audio_urls.map((_, i) => `file 'audio${i}.mp3'`).join('\n');
        await ffmpeg.writeFile('audiolist.txt', audioList);
        await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'audiolist.txt', '-c', 'copy', 'audio.mp3']);

        generateBtn.textContent = 'Step 3/3: Rendering MP4... 30-60s';
        resultDiv.innerHTML = '<p>Stitching video in your browser. Keep this tab open...</p>';

        // Make video: 3 sec per image + full audio
        await ffmpeg.exec(['-r', '1/3', '-i', 'img%d.jpg', '-i', 'audio.mp3', '-c:v', 'libx264', '-c:a', 'aac', '-shortest', '-pix_fmt', 'yuv420p', 'output.mp4']);

        const videoData = await ffmpeg.readFile('output.mp4');
        const videoUrl = URL.createObjectURL(new Blob([videoData.buffer], { type: 'video/mp4' }));

        resultDiv.innerHTML = `
            <h3>✅ Video ready — 100% free!</h3>
            <video controls src="${videoUrl}" style="width:100%;max-width:400px;border-radius:8px;"></video>
            <a href="${videoUrl}" download="animai-english-scene.mp4" style="display:block;margin-top:10px;padding:12px;background:#e91e63;color:white;text-align:center;border-radius:8px;text-decoration:none;">Download MP4</a>
            <p style="margin-top:10px;font-size:12
