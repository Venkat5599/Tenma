/**
 * Test endpoint to check environment variables
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  return res.status(200).json({
    hasGroqKey: !!process.env.GROQ_API_KEY,
    keyLength: process.env.GROQ_API_KEY?.length || 0,
    keyPrefix: process.env.GROQ_API_KEY?.substring(0, 10) || 'none',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('GROQ') || k.includes('API')),
  });
}
