import Replicate from 'replicate';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });
  
  const { script, ratio } = req.body;
  const startTime = Date.now();
  
  try {
    // 1. Split script into scenes - take first 3 for Day 3 test
    const scenes = script.split(/Scene \d+:/).filter(s => s.trim()).slice(0, 3);
    
    // 2. Generate 3 Ghibli images with Replicate SDXL
    const imagePrompts = scenes.map(scene => 
      `Ghibli anime style, soft watercolor, ${scene.trim()}, college romance, Telugu culture, highly detailed, 8k --ar ${ratio === '9:16' ? '9:16' : ratio === '1:1' ? '1:1' : '16:9'}`
    );
    
    const imagePromises = imagePrompts.map(prompt => 
      replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        { input: { prompt, negative_prompt: "blurry, low quality, text, watermark" } }
      )
    );
    
    // 3. Generate Telugu voice with ElevenLabs
    const voicePromise = fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
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
    
    // 4. Wait for all AI to finish
    const [images, voiceRes] = await Promise.all([
      Promise.all(imagePromises),
      voicePromise
    ]);
    
    const audioBuffer = await voiceRes.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    
    // 5. Return everything - Day 4 we stitch into video
    res.status(200).json({
      status: 'success',
      images: images.flat(), // array of image URLs
      audio: `data:audio/mpeg;base64,${audioBase64}`,
      credits_used: 50,
      time_taken: `${((Date.now() - startTime) / 1000).toFixed(1)}s`
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI generation failed', details: error.message });
  }
}
