import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cpf, nome, email } = req.body || {};

  if (!cpf) {
    return res.status(400).json({ error: 'CPF é obrigatório' });
  }

  // Clean user CPF (only digits)
  const cleanedUserCpf = (cpf as string).replace(/\D/g, '');

  try {
    // 1. Fetch the Google Sheet CSV format
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/1xYtHmOt8DfSfRlKEMiZkR2qWFs2BgEefc4xMj9QsUfQ/export?format=csv';

    const response = await fetch(sheetUrl);
    if (!response.ok) {
      throw new Error(`Erro ao baixar planilha do Google Sheets: ${response.statusText}`);
    }

    const csvContent = await response.text();

    // Parse CSV line-by-line and check for CPF
    const lines = csvContent.split(/\r?\n/);
    let isAuthorized = false;

    for (const line of lines) {
      const cells = line.split(',');
      for (const cell of cells) {
        const cleanedCell = cell.replace(/['"\\s]/g, '').replace(/\D/g, '');
        if (cleanedCell && cleanedCell === cleanedUserCpf) {
          isAuthorized = true;
          break;
        }
      }
      if (isAuthorized) break;
    }

    // 2. Also try Apps Script if not authorized yet
    if (!isAuthorized) {
      try {
        const appsScriptUrl = `https://script.google.com/macros/s/AKfycbwdbqroSgT1c3RBunmpifyebaTEvX_2sE0-4vxYOvwkX7ZHEmU-jnCTMv6AMvwY14ej/exec?cpf=${cleanedUserCpf}`;
        const scriptResponse = await fetch(appsScriptUrl, { redirect: 'follow' });
        if (scriptResponse.ok) {
          const resultText = await scriptResponse.text();
          if (
            resultText.toLowerCase().includes('true') ||
            resultText.toLowerCase().includes('authorized') ||
            resultText.toLowerCase().includes('autorizado') ||
            resultText.toLowerCase().includes('sucesso')
          ) {
            isAuthorized = true;
          }
        }
      } catch (scriptErr) {
        console.warn('Apps Script Call failed, falling back to direct spreadsheet resolution.');
      }
    }

    if (isAuthorized) {
      return res.json({ authorized: true });
    } else {
      return res.json({ authorized: false });
    }
  } catch (err: any) {
    console.error('Erro na validação do CPF:', err);

    return res.status(502).json({
      error:
        'Serviço de validação temporariamente indisponível. Por razões de segurança, o cadastro está bloqueado temporariamente.',
      indisponivel: true,
    });
  }
}
