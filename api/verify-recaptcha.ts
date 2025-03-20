export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'reCAPTCHA token is required' });
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.VITE_RECAPTCHA_SECRET_KEY!,
        response: token,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({
        success: false,
        error: 'reCAPTCHA verification failed',
      });
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}