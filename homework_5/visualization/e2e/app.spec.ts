import {test,expect} from '@playwright/test';
test('all tasks, presets, every frame, layouts and source',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 for(const task of ['Tracer','Permutations','AVL']){
  await page.getByRole('navigation').getByRole('button',{name:new RegExp(task)}).click();
  await expect(page.getByLabel('Пример',{exact:true})).toBeEnabled();
  const presets=await page.getByLabel('Пример',{exact:true}).locator('option').count();
  for(let i=0;i<presets;i++){
   await page.getByLabel('Пример',{exact:true}).selectOption(String(i));
   await expect(page.getByLabel('Пример',{exact:true})).toBeEnabled();
   const slider=page.getByLabel('Шаг алгоритма',{exact:true});const max=Number(await slider.getAttribute('max'));
   for(let step=0;step<=max;step++){
    await slider.fill(String(step));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    expect(await page.locator('.diagram-fit').evaluateAll(areas=>areas.every(area=>{
     const b=area.getBoundingClientRect();
     return [...area.querySelectorAll('.call-node rect,.node rect')].every(node=>{
      const r=node.getBoundingClientRect();return r.left>=b.left-1&&r.right<=b.right+1&&r.top>=b.top-1&&r.bottom<=b.bottom+1;
     });
    }))).toBe(true);
   }
   await expect(page.locator('.result')).toBeVisible();
  }
  await page.getByLabel('Пример',{exact:true}).selectOption('0');
  await expect(page.getByLabel('Пример',{exact:true})).toBeEnabled();
  const slider=page.getByLabel('Шаг алгоритма',{exact:true});await slider.fill(String(Math.floor(Number(await slider.getAttribute('max'))*.65)));
  await page.screenshot({path:info.outputPath(task+'.png'),fullPage:true});
  await page.getByRole('button',{name:'⤢ Развернуть',exact:true}).click();await expect(page.locator('.inputs')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:info.outputPath(task+'-focus.png'),fullPage:true});
  await page.keyboard.press('Escape');await expect(page.locator('.inputs')).toBeVisible();
  await page.getByRole('button',{name:'Объяснение',exact:true}).click();await expect(page.getByRole('heading',{name:'Идея решения'})).toBeVisible();
  await page.getByRole('button',{name:'Python и тесты',exact:true}).click();await expect(page.locator('.reading details').first()).toBeVisible();
 }
 expect(errors).toEqual([]);
});
test('invalid input preserves frames and playback can pause',async({page})=>{
 await page.goto('/');await expect(page.getByLabel('Пример',{exact:true})).toBeEnabled();
 await page.locator('.inputs summary').click();await page.getByLabel('Входные данные').fill('-1');await page.getByRole('button',{name:'Применить',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();
 await page.getByRole('button',{name:'▶ Запустить',exact:true}).click();await expect.poll(()=>page.getByLabel('Шаг алгоритма').inputValue()).not.toBe('0');
 await page.getByRole('button',{name:'Ⅱ Пауза',exact:true}).click();const value=await page.getByLabel('Шаг алгоритма').inputValue();await page.waitForTimeout(1300);expect(await page.getByLabel('Шаг алгоритма').inputValue()).toBe(value);
});
test('call results, backtracking, wide values and rotation comparison',async({page})=>{
 await page.goto('/');await expect(page.getByLabel('Пример',{exact:true})).toBeEnabled();
 const slider=page.getByLabel('Шаг алгоритма',{exact:true});
 await expect(page.locator('.equation strong')).toHaveText('?');
 await slider.fill('7');await expect(page.locator('.equation strong')).toHaveText('2');
 await expect(page.locator('.call-current .call-status')).toHaveText('↩ 2');
 await page.locator('.call-current').press('Enter');await expect(slider).toHaveValue('4');
 await expect(page.locator('.equation strong')).toHaveText('?');
 await page.getByRole('navigation').getByRole('button',{name:/Permutations/}).click();
 await expect(page.getByLabel('Пример',{exact:true})).toBeEnabled();
 await page.locator('.inputs summary').click();await page.getByLabel('Входные данные').fill('[-999,-12,0,24,999]');
 await page.getByRole('button',{name:'Применить',exact:true}).click();await expect(page.getByLabel('Пример',{exact:true})).toBeEnabled();
 await slider.fill('5');await expect(page.locator('.slot.filled')).toHaveCount(5);
 await expect(page.locator('.results>div')).toHaveCount(1);
 await expect(page.locator('.call-current').locator('text').first()).toHaveText('[-999,-12,0,24,999]');
 expect(await page.locator('.call-current').evaluate(g=>{const text=g.querySelector('text')!.getBBox(),rect=g.querySelector('rect')!.getBBox();return text.x>=rect.x&&text.x+text.width<=rect.x+rect.width})).toBe(true);
 await slider.fill((await slider.getAttribute('max'))!);await expect(page.locator('.results>div')).toHaveCount(120);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.getByRole('navigation').getByRole('button',{name:/AVL/}).click();await expect(page.getByLabel('Пример',{exact:true})).toBeEnabled();
 await page.getByLabel('Пример',{exact:true}).selectOption('1');await expect(page.getByLabel('Пример',{exact:true})).toBeEnabled();
 await slider.fill('2');await expect(page.getByLabel('Баланс 2',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'После поворота →',exact:true}).click();await expect(page.getByLabel('Баланс 0',{exact:true})).toBeVisible();
 await expect(page.locator('.ordered-keys>div')).toHaveText('102030');
 await page.getByRole('button',{name:'← До поворота',exact:true}).click();await expect(slider).toHaveValue('2');
});

test('fit restores the entire diagram after manual zoom',async({page})=>{
 await page.goto('/');await expect(page.getByLabel('Пример',{exact:true})).toBeEnabled();
 await page.getByLabel('Шаг алгоритма',{exact:true}).fill('5');
 await expect(page.locator('.stack-slab')).toHaveCount(6);
 expect(await page.locator('.stack-scroll').evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);
 await page.getByRole('button',{name:'Увеличить: Дерево вызовов',exact:true}).click();
 await expect(page.locator('.diagram-fit')).toHaveCount(0);
 await page.getByRole('button',{name:'Вписать всё',exact:true}).click();
 await expect(page.locator('.diagram-fit')).toHaveCount(1);
 expect(await page.locator('.diagram-fit').evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1)).toBe(true);
});
