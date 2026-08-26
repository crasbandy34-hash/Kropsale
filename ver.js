const { chromium } = require('playwright');
(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: false, args: ['--no-sandbox'] });
    console.log('Navegador headed iniciado.');
  } catch (e) {
    console.log('No se pudo abrir ventana visible, usando headless:', e.message);
    browser = await chromium.launch({ headless: true });
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 880 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/Janni/AppData/Local/Temp/opencode/ver_desktop.png', fullPage: true });
  console.log('Captura escritorio lista.');

  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await m.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await m.waitForTimeout(800);
  await m.screenshot({ path: 'C:/Users/Janni/AppData/Local/Temp/opencode/ver_mobile.png', fullPage: true });
  console.log('Captura móvil lista.');

  console.log('Dejando el navegador abierto 20s para que lo veas...');
  await page.waitForTimeout(20000);
  await browser.close();
  console.log('Cerrado.');
})();
