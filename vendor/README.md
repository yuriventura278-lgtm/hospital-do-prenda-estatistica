# Bibliotecas de terceiros (auto-hospedadas)

Estas bibliotecas eram carregadas a partir de CDNs externos (cdnjs / jsdelivr)
diretamente nas páginas HTML. Passaram a ser servidas a partir daqui, do próprio
sistema, por duas razões:

1. **Segurança (supply-chain):** deixámos de depender de um servidor externo que,
   se fosse comprometido, poderia injetar código a correr sobre dados clínicos.
   Os ficheiros aqui são fixos e versionados neste repositório.
2. **Funcionamento offline / ligações lentas:** por serem servidos da mesma
   origem que o resto do sistema, o service worker (`sw.js`) guarda-os em cache
   automaticamente. Antes, sem rede, os PDFs e gráficos deixavam de funcionar
   porque os CDNs não estavam acessíveis.

## Conteúdo e versões (exatamente as mesmas que os CDNs serviam)

| Ficheiro | Biblioteca | Versão | Origem original |
|----------|------------|--------|-----------------|
| `jspdf.umd.min.js` | jsPDF | 2.5.1 | cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1 |
| `jspdf.plugin.autotable.min.js` | jspdf-autotable | 3.8.2 | cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2 |
| `html2canvas.min.js` | html2canvas | 1.4.1 | cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1 |
| `chart.umd.min.js` | Chart.js | 4.4.4 | cdnjs / jsdelivr chart.js@4.4.4 (dist/chart.umd.js, já minificado) |
| `xlsx-js-style.min.js` | xlsx-js-style | 1.2.0 | jsdelivr xlsx-js-style@1.2.0 (dist/xlsx.bundle.js, o standalone de browser recomendado no readme da biblioteca) |
| `pdfobject.min.js` | PDFObject | 2.1.1 | cdnjs.cloudflare.com/ajax/libs/pdfobject/2.1.1 |

## SHA-256 (para verificação de integridade)

```
98ccf17aa10c20bb1301762618fcc9b6ab3a4e7f26b6071d64d0b41154df3875  jspdf.umd.min.js
27a9c3b61843c6312b87f142d40fe77c0f0f054c9f3cdeccc4bfd5f3322859c8  jspdf.plugin.autotable.min.js
e87e550794322e574a1fda0c1549a3c70dae5a93d9113417a429016838eab8cb  html2canvas.min.js
fed6a739f8d0f0687174de6cd14745fc0fc7809144ab113d22908a26bf0d7fea  chart.umd.min.js
1c7abf2993ff2cd61e508f9268e9acda0098c9796f3925d2ba0d2579072653e2  xlsx-js-style.min.js
ad83d7ddd5eaf0d879df612f092d9fa1ec93826cdb702f2efa70a4feb12d2970  pdfobject.min.js
```

## Como atualizar / regenerar

Estes ficheiros foram obtidos do registo oficial do npm (não descarregados de um
CDN). Para atualizar uma versão:

```bash
npm install --no-save jspdf@<versão> jspdf-autotable@<versão> html2canvas@<versão> chart.js@<versão> xlsx-js-style@<versão> pdfobject@<versão>
cp node_modules/jspdf/dist/jspdf.umd.min.js                        vendor/jspdf.umd.min.js
cp node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.min.js vendor/jspdf.plugin.autotable.min.js
cp node_modules/html2canvas/dist/html2canvas.min.js               vendor/html2canvas.min.js
cp node_modules/chart.js/dist/chart.umd.js                        vendor/chart.umd.min.js
cp node_modules/xlsx-js-style/dist/xlsx.bundle.js                 vendor/xlsx-js-style.min.js
cp node_modules/pdfobject/pdfobject.min.js                        vendor/pdfobject.min.js
```

Depois atualize a tabela de versões e as somas SHA-256 acima
(`sha256sum vendor/*.js`).
