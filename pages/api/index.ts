import {
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import path from 'path';
import type { NextApiHandler } from 'next';
import { nanoid } from 'nanoid/non-secure';
import puppeteer, { type Browser } from 'puppeteer';

let globalBrowser: Browser | null = null;
const folderName = 'public/pdfS';
const pdfDir = path.join(process.cwd(), folderName);
const cacheFile = path.join(process.cwd(), 'cache.json');

const launchBrowser = async () => {
  if (!globalBrowser) {
    globalBrowser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return globalBrowser;
};

const ensurePdfDirectoryExists = () => {
  if (!existsSync(pdfDir)) {
    mkdirSync(pdfDir);
  }
};

const clearCache = () => {
  if (existsSync(pdfDir)) {
    readdirSync(pdfDir).forEach((file) => {
      const filePath = path.join(pdfDir, file);
      unlinkSync(filePath);
    });
  }

  // Clear the cache.json file
  if (existsSync(cacheFile)) {
    unlinkSync(cacheFile);
  }
};

const readCache = (): Record<string, string> => {
  if (existsSync(cacheFile)) {
    const data = readFileSync(cacheFile, 'utf8');
    return JSON.parse(data) as Record<string, string>;
  }
  return {};
};

const writeCache = (cache: Record<string, string>) => {
  writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
};

const puppeteerHandler = async (url: string, filePath: string) => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
    });
  } finally {
    await page.close();
  }
};

interface Response {
  data?: any;
  error?: { message: string; cache?: Record<string, string> };
  isSuccess: boolean;
}

const handler: NextApiHandler<Response> = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({
      error: { message: 'Method Not Allowed' },
      isSuccess: false,
    });
  }

  if (req.method === 'DELETE') {
    clearCache();
    writeCache({}); // Clear the cache.json file
    return res.status(200).json({
      data: {
        message: 'Cache Cleared',
      },
      isSuccess: true,
    });
  }

  try {
    const port = req.socket.localPort;
    const startTime = Date.now();
    const baseUrl = `http://localhost:${port}`;
    const { targetPath, ...rest } = req.query as {
      targetPath: string;
      [key: string]: string;
    };

    const cache = readCache();

    if (!targetPath)
      return res.status(400).json({
        error: { message: 'targetPath is required', cache },
        isSuccess: false,
      });

    if (!targetPath.startsWith('/'))
      return res.status(400).json({
        error: { message: 'Target path should start with /' },
        isSuccess: false,
      });

    const newQuery = new URLSearchParams(rest).toString();
    const url = `${baseUrl}${targetPath}${newQuery ? `?${newQuery}` : ''}`;

    ensurePdfDirectoryExists();

    let pdfFileName = cache[url];
    if (!pdfFileName) {
      pdfFileName = `${nanoid()}.pdf`;
      const filePath = path.join(pdfDir, pdfFileName);
      await puppeteerHandler(url, filePath);
      cache[url] = pdfFileName;
      writeCache(cache);
    }

    return res.status(200).json({
      data: {
        url,
        psdUrl: `${baseUrl}/pdfS/${pdfFileName}`,
        pdfFileName,
        timeTaken: Date.now() - startTime,
      },
      isSuccess: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        message:
          error instanceof Error ? error.message : 'Unknown Server Error',
      },
      isSuccess: false,
    });
  }
};

export default handler;
