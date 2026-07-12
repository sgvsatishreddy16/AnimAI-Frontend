export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).json({ error: 'Only POST' });
  
  const { script, ratio } = req.body;
  
  try {
    // 1. Parse script: Split by Scene, extract VISUAL and DIALOGUE
    const sceneBlocks = script.split(/Scene \d+:/i).filter(s => s.trim());
    
    const visuals = [];
    const dialogues = [];
    
    sceneBlocks.forEach(block => {
      const visualMatch = block.match(/\[VISUAL:(.*?)\]/i);
      const dialogueMatch = block.match(/DIALOGUE:\s*"(.*?)"/i);
      
      if (visualMatch) visuals.push(visualMatch[1].trim());
      if (dialogueMatch) dialogues.push(dialogueMatch[1].trim());
    });
    
    if (visuals.length === 0) throw new Error('No [VISUAL:...] found. Use the new format.');
    
    // 2. Images: Use VISUAL description only
    const ar = ratio === '9:16'? '9:16' : ratio === '1:1'? '1:1' : '16:9';
    const images = visuals.map(v => {
      const prompt = encodeURIComponent(`Ghibli anime style, cinematic, ${v}, soft watercolor, highly detailed, 8k`);
      return `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=${ar === '9:16'? '1792' : ar === '1:1'? '1024' : '576'}&nologo=true&enhance=true`;
    });
    
    // 3. Voice: Use DIALOGUE only, join with pause. ElevenLabs US voice
    const cleanDialogue = dialogues.join('... '); //... = natural pause
    
    const voiceRes = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', { // Rachel - US Female
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: cleanDialogue,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { 
          stability: 0.4,
          similarity_boost: 0.8,
          style: 0.5, // More expressive
          use_speaker_boost: true 
        }
      })
    });
    
    if (!voiceRes.ok) throw new Error(`ElevenLabs error: ${await voiceRes.text()}`);
    const audioBuffer = await voiceRes.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    
    // 4. Return for browser to stitch video
    res.status(200).json({
      status: 'success',
      images: images,
      audio: `data:audio/mpeg;base64,${audioBase64}`,
      ratio: ar,
      cost_usd: 0
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Generation failed', details: error.message });
  }
}
