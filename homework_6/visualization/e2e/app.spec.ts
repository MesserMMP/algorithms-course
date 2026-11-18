import {expect, test, type Page} from '@playwright/test';

const button = (page:Page, name:string) => page.getByRole('button', {name, exact:true});
const stage = (page:Page) => page.locator('.s6-stage');
const timeline = (page:Page) => page.getByRole('slider', {name:'Шаг', exact:true});

async function openDemo(page:Page) {
  await page.goto('./');
  await expect(stage(page)).toHaveAttribute('data-kind', 'start');
}

async function setExample(page:Page, values:number[], k?:number) {
  await page.locator('.editor summary').click();
  await page.getByRole('textbox', {name:'Массив', exact:true}).fill(JSON.stringify(values));
  if (k !== undefined) {
    await page.getByRole('spinbutton', {name:'k', exact:true}).fill(String(k));
  }
  await button(page, 'Применить').click();
  await expect(stage(page)).toHaveAttribute('data-kind', 'start');
  await expect(stage(page).locator('.s6-token')).toHaveCount(values.length);
}

async function inspectPlot(page:Page) {
  return stage(page).evaluate(el => {
    const plot=el.querySelector('.s6-plot')!;
    const rect=plot.getBoundingClientRect();
    const tiles=Array.from(plot.querySelectorAll<HTMLElement>('.s6-token'));
    const clipped=tiles.filter(tile=>{
      const val=tile.querySelector('.s6-val')!.getBoundingClientRect();
      return val.left<rect.left-1 || val.right>rect.right+1 || val.top<rect.top-1 || val.bottom>rect.bottom+1;
    });
    return {
      height: rect.height,
      pageFits: document.documentElement.scrollWidth<=innerWidth+1,
      clipped: clipped.map(tile=>tile.dataset.origin),
      identities: tiles.map(tile=>tile.dataset.origin).sort(),
    };
  });
}

test('every example keeps every value visible and finishes with its correct result', async ({page}, info)=>{
  const errors:string[]=[];
  let requested:{values:number[];k:number}|undefined;
  page.on('request',request=>{
    if(request.method()==='POST' && new URL(request.url()).pathname==='/api/trace') {
      requested=request.postDataJSON();
    }
  });
  page.on('pageerror',error=>errors.push(error.message));
  await openDemo(page);
  for (const task of ['Compare','Iterative','K-th']) {
    await button(page,task).click();
    const methods=task==='K-th'?['Quickselect']:['Merge sort','Quicksort'];
    for (const method of methods) {
      if (task!=='K-th') await button(page,method).click();
      const example=page.getByLabel('Пример',{exact:true});
      const presets=await example.locator('option').evaluateAll(options=>options.map(o=>(o as HTMLOptionElement).value));
      for (const selected of presets) {
        await example.selectOption(selected);
        await expect(stage(page)).toHaveAttribute('data-kind','start');
        const numbers=[...requested!.values].sort((a,b)=>a-b);
        const end=Number(await timeline(page).getAttribute('max'));
        const rank=requested!.k;
        const baseline=await inspectPlot(page);
        expect(baseline.identities.length).toBe(numbers.length);
        const visited=new Set<string>();
        for(let step=0;step<=end;step++) {
          await timeline(page).fill(String(step));
          const status=await inspectPlot(page);
          expect(status.pageFits, task + ' / ' + method + ', пример ' + selected + ', шаг ' + step).toBe(true);
          expect(status.clipped).toEqual([]);
          expect(status.identities).toEqual(baseline.identities);
          expect(status.height).toBeCloseTo(baseline.height,0);
          const kind=(await stage(page).getAttribute('data-kind'))!;
          if (selected===presets[0] && !visited.has(kind) && ['merge-write','scan','keep'].includes(kind)) {
            await page.screenshot({path:info.outputPath(task+'-'+method+'-'+kind+'.png'),fullPage:true});
            visited.add(kind);
          }
        }
        const result=task==='K-th'?String(numbers[numbers.length-rank]):'['+numbers.join(', ')+']';
        await expect(page.locator('.answer strong')).toHaveText(result);
      }
    }
  }
  expect(errors).toEqual([]);
});

test('phase navigation explains individual reads, writes, partitions and discarded ranges', async ({page})=>{
  await openDemo(page);
  await expect(page.getByRole('button',{name:'Замер времени',exact:true})).toHaveCount(0);
  const phases=page.getByRole('combobox',{name:'Этап',exact:true});
  await phases.selectOption({index:1});
  await expect(stage(page)).toHaveAttribute('data-source-step','1');
  await expect(timeline(page)).not.toHaveValue('0');
  await setExample(page,[5,1,4,2]);
  const kinds=new Set<string>();
  const max=Number(await timeline(page).getAttribute('max'));
  for(let i=0;i<=max;i++) {
    await timeline(page).fill(String(i));
    const kind=(await stage(page).getAttribute('data-kind'))!;
    kinds.add(kind);
    if(kind==='merge-read') {
      expect(await page.locator('.s6-token[data-lane="buffer"]').count()).toBeGreaterThan(0);
    }
    if(kind==='merge-write') {
      await expect(stage(page).locator('.s6-story')).toContainText(/\d/);
    }
  }
  expect(kinds.has('merge-read')).toBe(true);
  expect(kinds.has('merge-write')).toBe(true);
  await button(page,'K-th').click();
  await expect(stage(page)).toHaveAttribute('data-kind','start');
  const seen=new Set<string>();
  const last=Number(await timeline(page).getAttribute('max'));
  for(let i=0;i<=last;i++) {
    await timeline(page).fill(String(i));
    const kind=(await stage(page).getAttribute('data-kind'))!;
    seen.add(kind);
    if(kind==='keep') {
      const lo=Number(await stage(page).getAttribute('data-lo'));
      const hi=Number(await stage(page).getAttribute('data-hi'));
      const outside=await page.locator('.s6-token[data-tone="dim"]').count();
      const n=await page.locator('.s6-token').count();
      expect(outside).toBe(n-(hi-lo));
      expect(outside).toBeGreaterThan(0);
    }
  }
  for(const kind of ['scan','partition','keep','found']) expect(seen.has(kind)).toBe(true);
  await button(page,'Разбор и код').click();
  await expect(page.locator('.reader')).toBeVisible();
  await button(page,'Разбор и код').click();
  await expect(page.locator('.reader')).toBeHidden();
});

test('invalid rank can be corrected and autoplay can pause and resume',async({page})=>{
  await openDemo(page);
  await button(page,'K-th').click();
  await page.locator('.editor summary').click();
  await page.getByRole('textbox',{name:'Массив',exact:true}).fill('[-999,0,999,0]');
  const rank=page.getByRole('spinbutton',{name:'k',exact:true});
  await rank.fill('5');
  await button(page,'Применить').click();
  await expect(page.getByRole('alert')).toBeVisible();
  await rank.fill('2');
  await button(page,'Применить').click();
  await expect(stage(page)).toHaveAttribute('data-kind','start');
  await button(page,'Развернуть').click();
  await button(page,'Запустить').click();
  await expect.poll(()=>timeline(page).inputValue()).not.toBe('0');
  await button(page,'Пауза').click();
  const paused=await timeline(page).inputValue();
  await page.clock.install();
  await page.clock.fastForward(3000);
  await expect(timeline(page)).toHaveValue(paused);
  await button(page,'Запустить').click();
  await page.clock.fastForward(1600);
  await expect(timeline(page)).not.toHaveValue(paused);
  await button(page,'В конец').click();
  await expect(page.locator('.answer strong')).toHaveText('0');
  await page.keyboard.press('Escape');
  await expect(button(page,'Развернуть')).toBeVisible();
});

test('a merge moves the same labelled values between lanes and honours reduced motion',async({page})=>{
  await openDemo(page);
  await setExample(page,[2,1]);
  const slider=timeline(page);
  const last=Number(await slider.getAttribute('max'));
  let pickup=-1;
  for(let i=1;i<=last;i++){
    await slider.fill(String(i));
    if(await stage(page).getAttribute('data-kind')==='merge-read'){
      pickup=i;
      break;
    }
  }
  expect(pickup).toBeGreaterThan(0);
  const token=page.locator('.s6-token[data-origin="0"]');
  await slider.fill(String(pickup-1));
  await expect(token).toHaveAttribute('data-lane','array');
  const resting=await token.boundingBox();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await slider.fill(String(pickup));
  await expect(token).toHaveAttribute('data-lane','buffer');
  await expect(token.locator('.s6-val')).toHaveText('2');
  const durations=await token.evaluate(el=>el.getAnimations().map(motion=>Number(motion.effect?.getComputedTiming().duration)));
  expect(Math.max(0,...durations)).toBeGreaterThan(100);
  await token.evaluate(el=>Promise.all(el.getAnimations().map(motion=>motion.finished)));
  const lifted=await token.boundingBox();
  expect(Math.abs(lifted!.y-resting!.y)).toBeGreaterThan(5);
  await page.emulateMedia({reducedMotion:'reduce'});
  await slider.fill(String(pickup-1));
  await expect(token).toHaveAttribute('data-lane','array');
  const reduced=await token.evaluate(el=>el.getAnimations().map(motion=>Number(motion.effect?.getComputedTiming().duration)));
  expect(Math.max(0,...reduced)).toBeLessThan(50);
});
