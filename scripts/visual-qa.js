async (page) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const captured = [];
  for (const [width,height] of [[1440,900],[1920,1080],[768,1024],[390,844]]) {
    await page.setViewportSize({width,height});
    await page.goto('http://localhost:8788/');
    await page.getByRole('button',{name:'Enter SimLab',exact:true}).waitFor();
    await page.waitForTimeout(1200);
    const intro=`docs/screenshots/rebuild-intro-${width}.png`;
    await page.screenshot({path:intro});captured.push(intro);
    await page.getByRole('button',{name:'Enter SimLab',exact:true}).click();
    await page.getByLabel('Describe a system to simulate').waitFor();
    await page.waitForTimeout(1200);
    const gateway=`docs/screenshots/rebuild-gateway-${width}.png`;
    await page.screenshot({path:gateway});captured.push(gateway);
    const components=await page.evaluate(()=>window.__MUSE_SCENE__?.components.length);
    if(components!==0)throw new Error('Gateway contains lab components');
  }
  return {captured,errors};
}
