export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' });
  
  const { script, ratio } = req.body;
  
  // Day 2: Just confirm backend works. Day 3: Real AI here
  console.log('Script received:', script.substring(0, 50));
  console.log('Ratio:', ratio);
  console.log('ElevenLabs key exists:', !!process.env.ELEVENLABS_API_KEY);
  console.log('Replicate key exists:', !!process.env.REPLICATE_API_TOKEN);
  
  res.status(200).json({ 
    status: 'success', 
    message: 'Backend connected! Both API keys detected. Real AI coming Day 3.',
    credits_used: 0
  });
}
