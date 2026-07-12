export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });
  
  const { script, ratio } = req.body;
  const startTime = Date.now();
  
  try {
    // 1. Split script into scenes - take first 3 for test
    const scenes = script.split(/Scene \d+:/).filter(s => s.trim()).slice(0, 3);
    
    // 2. Generate 3 Ghibli images with FREE Pollinations AI - no API key needed
    const ar = ratio === '9:16' ? '9:16' : ratio === '1:1' ? '1:1' : '16:9';
    const images = scenes.map(scene => {
      const prompt = encodeURIComponent(`Ghibli anime style, soft watercolor, ${scene.trim()}, college romance, Telugu culture, highly detailed, 8k`);
      return `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=${ar === '9:16' ? '1792' : ar === '1:1' ? '1024' : '576'}&nologo=true`;
    });
    
    // 3. Generate Telugu voice with ElevenLabs - uses your 10k free credits
    const voiceRes = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });
    
    if (!voiceRes.ok) throw new Error(`ElevenLabs error: ${await voiceRes.text()}`);
    
    const audioBuffer = await voiceRes.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    
    // 4. Return everything - 100% FREE
    res.status(200).json({
      status: 'success',
      images: images,
      audio: `data:audio/mpeg;base64,${audioBase64}`,
      credits_used: 40, // Only ElevenLabs credits
      cost_usd: 0,
      time_taken: `${((Date.now() - startTime) / 1000).toFixed(1)}s`
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Generation failed', details: error.message });
  }
}
