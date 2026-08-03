# Implantação

## Build de produção

```bash
npm ci
npm run check
npm run build
```

O diretório publicável é `dist/`. Antes de publicar, execute também `npm run test:e2e` com Chromium instalado.

## Vercel

1. Importe o repositório.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Node.js: 24.

Não configure variáveis de ambiente: a aplicação não usa chaves. A Vercel fornece HTTPS, requisito para geolocalização e PWA.

Para reforçar a CSP como header HTTP, um administrador pode reproduzir o valor do meta `Content-Security-Policy` em `vercel.json`; o meta permanece como fallback portátil.

## GitHub Pages

O `base: './'` do Vite torna assets e service worker relativos ao diretório do projeto.

1. Execute `npm ci && npm run build` em uma Action.
2. Faça upload de `dist/` com `actions/upload-pages-artifact`.
3. Publique com `actions/deploy-pages` e permissão `pages: write`.
4. Em **Settings → Pages**, selecione GitHub Actions como source.

O workflow de CI incluído valida o projeto, mas não publica nada automaticamente. Essa separação impede deploy sem autorização explícita.

## Verificação pós-publicação

- Abra a aplicação em uma janela sem dados locais.
- Teste uma cidade fora do Brasil e confirme o horário local.
- Teste busca, favorito, comparação, inversão, temas e unidades.
- Instale a PWA e depois simule offline; o snapshot deve aparecer com aviso de desatualização.
- Verifique console, manifest, service worker e CSP no DevTools.
- Confirme ausência de requisições para origens além da hospedagem e dos três endpoints Open-Meteo.
