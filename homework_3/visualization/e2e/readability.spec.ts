import {test, expect, type Page} from '@playwright/test';
import { examples } from '../src/examples';
import type { Task } from '../src/algorithms';
const names: Record<Task, string> = {two_sum: 'Two sum', anagrams: 'Anagrams', hash_table: 'Хеш-таблица'};

async function checkLayout(page: Page) {
  const problems = await page.evaluate(() => {
    const errors: string[] = [];
    if (document.documentElement.scrollWidth > innerWidth) errors.push('Страница шире экрана');
    for (const el of document.querySelectorAll<HTMLElement>('.complexity, .tabs, .input-panel, .canvas-panel, .canvas-body, .player, .pseudo, .array-cell, .record, .group, .result, .source')) {
      if (!el.getClientRects().length) continue;
      const box = el.getBoundingClientRect();
      if (box.left < -1 || box.right > innerWidth + 1) errors.push(`${el.className}: за краем экрана`);
      if (el.scrollWidth > el.clientWidth + 1) errors.push(`${el.className}: горизонтальное переполнение`);
    }
    return errors;
  });
  expect(problems).toEqual([]);
}

test('каждый пример на каждом шаге: границы, шрифты и длинный стартовый сценарий', async ({page}, testInfo) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  for (const task of Object.keys(names) as Task[]) {
    await page.getByRole('button', {name: new RegExp(names[task])}).click();
    const defaultMax = Number(await page.getByLabel('Шаг алгоритма', {exact: true}).getAttribute('max'));
    expect(defaultMax).toBeGreaterThanOrEqual(15);
    expect(defaultMax).toBeLessThanOrEqual(25);
    const fonts = await page.locator('.complexity strong, .complexity span, .tabs button, .section-heading h2').evaluateAll(els => els.map(el => ({size: parseFloat(getComputedStyle(el).fontSize), tag: el.tagName})));
    for (const f of fonts) {
      expect(f.size).toBeGreaterThanOrEqual(f.tag === 'STRONG' ? 19 : 13);
      expect(f.size).toBeLessThanOrEqual(f.tag === 'STRONG' ? 20 : 17);
    }
    for (const example of examples[task]) {
      await page.getByRole('button', {name: example.name, exact: true}).click();
      const slider = page.getByLabel('Шаг алгоритма', {exact: true});
      const max = Number(await slider.getAttribute('max'));
      for (let step = 0; step <= max; step++) {
        await slider.fill(String(step));
        await checkLayout(page);
      }
    }
    await page.getByRole('button', {name: examples[task][0].name, exact: true}).click();
    const slider = page.getByLabel('Шаг алгоритма', {exact: true});
    await slider.fill(String(Math.floor(defaultMax / 2)));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({path: testInfo.outputPath(`${task}-long.png`), fullPage: true, animations: 'disabled'});
    await page.locator('.workspace').screenshot({path: testInfo.outputPath(`${task}-workspace.png`), animations: 'disabled'});
  }
  expect(errors).toEqual([]);
});

test('максимальные допустимые входы и длинные подписи не обрезаются', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/');
  for (const task of Object.keys(names) as Task[]) {
    await page.getByRole('button', {name: new RegExp(names[task])}).click();
    if (task === 'two_sum') {
      await page.getByLabel('Массив arr').fill(JSON.stringify(Array.from({length: 32}, (_, i) => -1000000 + i)));
      await page.getByLabel('Сумма k').fill('2000000');
    } else if (task === 'anagrams') {
      await page.getByLabel('Список слов strs').fill(JSON.stringify(Array.from({length: 24}, (_, i) => 'я'.repeat(30) + String(i).padStart(2, '0'))));
    } else {
      await page.getByLabel('Сценарий операций').fill(Array.from({length: 24}, (_, i) => `set ${-1000000 + i * 32} ${'я'.repeat(40)}`).join('\n'));
    }
    await page.getByRole('button', {name: 'Применить', exact: true}).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    const slider = page.getByLabel('Шаг алгоритма', {exact: true});
    await slider.fill((await slider.getAttribute('max'))!);
    await checkLayout(page);
    await expect(page.getByRole('button', {name: 'Повторить', exact: true})).toBeEnabled();
    await page.getByRole('tab', {name: 'Python-код', exact: true}).click();
    await checkLayout(page);
    await page.getByRole('tab', {name: 'Визуализация', exact: true}).click();
  }
});
