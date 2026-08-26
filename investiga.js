const { chromium } = require('playwright');
(async () => {
  // Modo visual: abre una ventana real de Chromium
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });

  console.log('PASO 1: Abriendo http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'C:/Users/Janni/AppData/Local/Temp/opencode/investiga_1_desktop.png', fullPage: true });
  console.log('  -> captura: investia_1_desktop.png');

  console.log('PASO 2: Inspeccionando estructura del DOM ...');
  const titulo = await page.$eval('header h1', el => el.textContent.trim());
  const tarjetas = await page.$$eval('.tarjeta h2', els => els.map(e => e.textContent.trim()));
  const nInputs = await page.$$eval('input,textarea', els => els.length);
  console.log('  -> titulo:', titulo);
  console.log('  -> secciones:', tarjetas.join(' | '));
  console.log('  -> total de campos:', nInputs);

  console.log('PASO 3: Probando estado de foco en un campo (diseño) ...');
  await page.click('#p-privilegios');
  await page.type('#p-privilegios', 'Sara, David');
  await page.waitForTimeout(400);
  const focusColor = await page.$eval('#p-privilegios', el => getComputedStyle(el).borderColor);
  const focusShadow = await page.$eval('#p-privilegios', el => getComputedStyle(el).boxShadow.slice(0, 40));
  console.log('  -> border en foco:', focusColor);
  console.log('  -> box-shadow en foco:', focusShadow);
  await page.screenshot({ path: 'C:/Users/Janni/AppData/Local/Temp/opencode/investiga_2_focus.png' });

  console.log('PASO 4: Vista móvil (iPhone) ...');
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await m.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await m.waitForTimeout(600);
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log('  -> overflow horizontal móvil (debe ser 0):', overflow);
  await m.screenshot({ path: 'C:/Users/Janni/AppData/Local/Temp/opencode/investiga_3_mobile.png', fullPage: true });

  console.log('PASO 5: Llenando un registro y guardando para ver la lista ...');
  await page.fill('#fecha-planeacion', '2026-08-22');
  await page.fill('#p-predica', 'Urania');
  await page.click('.btn.primario');
  await page.waitForTimeout(800);
  const registros = await page.$$eval('.registro', els => els.length);
  console.log('  -> registros visibles en lista:', registros);
  await page.screenshot({ path: 'C:/Users/Janni/AppData/Local/Temp/opencode/investiga_4_guardado.png', fullPage: true });

  console.log('\nInvestigación completa. Capturas en C:/Users/Janni/AppData/Local/Temp/opencode/');
  console.log('El navegador queda abierto 8s para que lo veas...');
  await page.waitForTimeout(8000);
  await browser.close();
})();
