import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3333;

app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post('/analyze', upload.any(), async (req: Request, res: Response) => {
  try {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Missing GOOGLE_GEMINI_API_KEY' });
    }
    const file = (req as any).file || (Array.isArray((req as any).files) ? (req as any).files[0] : undefined);
    if (!file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    // Use a Gemini model that supports multimodal input
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Compress and downscale image to reduce token cost
    const processed: Buffer = await sharp(file.buffer)
      .rotate()
      // Preserve aspect ratio by setting only width and preventing enlargement
      .resize({ width: 1280, withoutEnlargement: true })
      .jpeg({ quality: 72 })
      .toBuffer();
    const base64Image = processed.toString('base64');
    const mimeType = 'image/jpeg';

    const prompt = req.body.prompt || 'Describe this image in detail.';

    // Send prompt and image as separate parts to avoid oneof conflicts
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType } },
          ],
        },
      ],
    } as any);

    const responseText = result.response?.text?.() ?? '';
    res.json({ description: responseText });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Failed to analyze image' });
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
