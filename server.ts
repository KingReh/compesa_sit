import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory or file-based logs for audit
  const LOGS_FILE = path.join(process.cwd(), "src/audit_logs.json");
  
  function getLogs() {
    try {
      if (fs.existsSync(LOGS_FILE)) {
        return JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"));
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  function addLog(log: any) {
    try {
      const logs = getLogs();
      logs.push(log);
      fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
    } catch (e) {
      console.error(e);
    }
  }

  // API Route: Audit logs
  app.get("/api/audit-logs", (req, res) => {
    res.json(getLogs());
  });

  // API Route: CPF Validation
  app.post("/api/validate-cpf", async (req, res) => {
    const { cpf, nome, email } = req.body;
    
    if (!cpf) {
      return res.status(400).json({ error: "CPF é obrigatório" });
    }

    // Clean user CPF (only digits)
    const cleanedUserCpf = cpf.replace(/\D/g, "");

    const now = new Date().toISOString();
    const logEntry = {
      timestamp: now,
      nome: nome || "Anônimo",
      email: email || "Não informado",
      cpf: cleanedUserCpf,
      status: "Pendente",
      source: "Google Sheets"
    };

    try {
      // 1. Let's fetch the Google Sheet CSV format
      const sheetUrl = "https://docs.google.com/spreadsheets/d/1xYtHmOt8DfSfRlKEMiZkR2qWFs2BgEefc4xMj9QsUfQ/export?format=csv";
      
      const response = await fetch(sheetUrl);
      if (!response.ok) {
        throw new Error(`Erro ao baixar planilha do Google Sheets: ${response.statusText}`);
      }

      const csvContent = await response.text();
      
      // Parse CSV line-by-line and check for CPF
      const lines = csvContent.split(/\r?\n/);
      let isAuthorized = false;

      for (const line of lines) {
        // Clean each cell/line to check if any matches
        const cells = line.split(",");
        for (const cell of cells) {
          const cleanedCell = cell.replace(/['"\s]/g, "").replace(/\D/g, "");
          if (cleanedCell && cleanedCell === cleanedUserCpf) {
            isAuthorized = true;
            break;
          }
        }
        if (isAuthorized) break;
      }

      // 2. Also try Apps Script if not authorized yet, to cover all bases
      if (!isAuthorized) {
        try {
          const appsScriptUrl = `https://script.google.com/macros/s/AKfycbwdbqroSgT1c3RBunmpifyebaTEvX_2sE0-4vxYOvwkX7ZHEmU-jnCTMv6AMvwY14ej/exec?cpf=${cleanedUserCpf}`;
          const scriptResponse = await fetch(appsScriptUrl, { redirect: "follow" });
          if (scriptResponse.ok) {
            const resultText = await scriptResponse.text();
            // Typically "authorized", true, or similar is returned in these scripts
            if (resultText.toLowerCase().includes("true") || resultText.toLowerCase().includes("authorized") || resultText.toLowerCase().includes("autorizado") || resultText.toLowerCase().includes("sucesso")) {
              isAuthorized = true;
            }
          }
        } catch (scriptErr) {
          console.warn("Apps Script Call failed, falling back to direct spreadsheet resolution.");
        }
      }

      if (isAuthorized) {
        logEntry.status = "Sucesso";
        addLog(logEntry);
        return res.json({ authorized: true });
      } else {
        logEntry.status = "Bloqueado";
        addLog(logEntry);
        return res.json({ authorized: false });
      }

    } catch (err: any) {
      console.error("Erro na validação do CPF:", err);
      logEntry.status = "Erro (Indisponível)";
      const errorMsg = err.message || String(err);
      
      // Use assignment with bracket notation to satisfy non-any strict structures
      (logEntry as any).details = errorMsg;
      addLog(logEntry);
      
      // "Caso a API do Google esteja indisponível: Informar erro temporário ao usuário. Bloquear o cadastro por segurança."
      return res.status(502).json({ 
        error: "Serviço de validação temporariamente indisponível. Por razões de segurança, o cadastro está bloqueado temporariamente.",
        indisponivel: true
      });
    }
  });

  // Serve static assets in production, or mount Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
