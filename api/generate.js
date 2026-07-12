export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).json({ error: 'Only POST' });

  const { script, ratio } = req.body;

  try {
    // 1. Smart Parser: Only grab VISUAL and DIALOGUE. Ignore everything else.
    const sceneBlocks = script.split(/Scene \d+:/i).filter(s => s.trim());

    const visuals = [];
    const dialogues = [];

    sceneBlocks.forEach(block => {
      const visualMatch = block.match(/\[VISUAL:(.*?)\]/is);
      const dialogueMatch = block.match(/DIALOGUE:\s*"([^"]+)"/is);

      if (visualMatch) visuals.push(visualMatch[1].trim());
      if (dialogueMatch) dialogues.push(dialogueMatch[1].trim());
    });

    if (visuals.length === 0) throw new Error('Format error: Use [VISUAL:...] and DIALOGUE: "..." for each scene');

    // 2. Ghibli images - FREE Pollinations
    const ar = ratio === '9:16'? '9:16' : ratio === '1:1'? '1:1' : '16:9';
    const images = visuals.map(v => {
      const prompt = encodeURIComponent(`Ghibli anime style, cinematic, ${v}, soft watercolor, 8k, highly detailed`);
      return `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=${ar === '9:16'? '1792' : ar === '1:1'? '1024' : '576'}&nologo=true&enhance=true`;
    });

    // 3. Voice: Google TTS - 100% FREE, US English. Splits long text automatically.
    const fullDialogue = dialogues.join('. ');
    const chunks = fullDialogue.match(/.{1,200}(?:\s|$)/g) || [fullDialogue];

    const audioUrls = chunks.map(chunk =>
      `https://translate.google.com/translate_tts?ie=UTF-8&tl=en-US&q=${encodeURIComponent(chunk.trim())}&client=tw-ob`
    );

    // 4. Return for browser to stitch video + audio chunks
    res.status(200).json({
      status: 'success',
      images: images,
      audio_urls: audioUrls,
      ratio: ar,
      cost_usd: 0
    });

  } catch (error) {
    res.status(500).json({ error: 'Generation failed', details: error.message });
  }
}
