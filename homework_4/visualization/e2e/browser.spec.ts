import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { examples } from '../src/examples';
import type { Order, Task } from '../src/algorithms';

const names: Record<Task, string> = {
  traversal: 'Обходы дерева',
  validate: 'Проверка BST',
  balance: 'Проверка баланса',
};
const tasks = Object.keys(names) as Task[];
const presetResults: Record<string, boolean> = {
  '9 узлов · корректное BST': true,
  'Нарушение границы предка': false,
  'Дубликат глубоко в дереве': false,
  'Ошибка рядом с корнем': false,
  'Отрицательные и ноль': true,
  '9 узлов · разная высота ветвей': true,
  'Дисбаланс ниже корня': false,
  'Баланс есть, BST нет': true,
  'Длинная цепочка': false,
  'Допустимая разница 1': true,
  'Один узел': true,
  'Пустое дерево': true,
};

async function selectTask(page: Page, task: Task) {
  await page.getByRole('navigation', { name: 'Задачи' }).getByRole('button', { name: new RegExp(names[task]) }).click();
  await page.getByRole('tab', { name: 'Визуализация', exact: true }).click();
}

async function applyInput(page: Page, input: string) {
  const editor = page.locator('.custom-input');
  if (!await editor.getAttribute('open').then(value => value !== null)) await editor.locator('summary').click();
  await page.getByRole('textbox').fill(input);
  await page.getByRole('button', { name: 'Применить', exact: true }).click();
}

async function lastStep(page: Page) {
  const slider = page.getByRole('slider', { name: 'Шаг алгоритма' });
  await slider.fill((await slider.getAttribute('max'))!);
}

async function checkLayout(page: Page) {
  const problems = await page.evaluate(() => {
    const errors: string[] = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) errors.push('Страница шире экрана');
    const selectors = '.page-heading, .complexity, .tabs, .input-panel, .input-row, .order-heading, .order-cards, .order-card, .direction-switch, .example-row, .custom-input, .canvas-panel, .step-explanation, .tree-viewport, .diagram-toolbar, .diagram-legend, .player, .inspector, .state-card, .node-card, .pseudo, .result, .reading, .code-panel, .source, .command, .browser-checks';
    for (const el of document.querySelectorAll<HTMLElement>(selectors)) {
      if (!el.getClientRects().length) continue;
      const box = el.getBoundingClientRect();
      if (box.left < -1 || box.right > innerWidth + 1) errors.push(`${el.className}: за краем экрана`);
      // The diagram deliberately scrolls independently, so a large tree stays legible.
      if (!el.classList.contains('tree-viewport') && el.scrollWidth > el.clientWidth + 1) {
        errors.push(`${el.className}: горизонтальное переполнение`);
      }
    }
    for (const group of document.querySelectorAll<SVGGElement>('.tree-node')) {
      const text = group.querySelector<SVGTextElement>(':scope > text');
      const rect = group.querySelector<SVGRectElement>(':scope > rect');
      if (!text || !rect) continue;
      const label = text.getBBox(), background = rect.getBBox();
      if (label.x < background.x + 2 || label.x + label.width > background.x + background.width - 2) {
        errors.push(`Подпись узла ${text.textContent} не помещается в узел`);
      }
    }
    for (const badge of document.querySelectorAll<SVGGElement>('.visit-badge, .node-label')) {
      const node = badge.closest('.tree-node')!;
      const text = badge.querySelector('text')!.getBoundingClientRect();
      const box = node.querySelector(':scope > rect')!.getBoundingClientRect();
      const value = node.querySelector(':scope > text')!.getBoundingClientRect();
      if (text.left < box.left + 1 || text.right > box.right - 1 || text.top < box.top + 1 || text.bottom > box.bottom - 1) {
        errors.push('Метка посещения или высоты не помещается внутри узла');
      }
      if (text.bottom > value.top + 1) {
        errors.push('Метка посещения или высоты перекрывает значение узла');
      }
    }
    return errors;
  });
  expect(problems).toEqual([]);
}

async function everyFrame(page: Page) {
  const slider = page.getByRole('slider', { name: 'Шаг алгоритма' });
  const max = Number(await slider.getAttribute('max'));
  for (let step = 0; step <= max; step++) {
    await slider.fill(String(step));
    await expect(slider).toHaveValue(String(step));
    await checkLayout(page);
  }
}

async function saveDefaultScreenshots(page: Page, info: TestInfo, task: Task) {
  if (!['desktop', 'mobile'].includes(info.project.name)) return;
  const slider = page.getByRole('slider', { name: 'Шаг алгоритма' });
  const max = Number(await slider.getAttribute('max'));
  for (const [label, step] of [['middle', Math.floor(max / 2)], ['end', max]] as const) {
    await slider.fill(String(step));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath(`${task}-${label}-page.png`), fullPage: true, animations: 'disabled' });
    await page.locator('.workspace').screenshot({ path: info.outputPath(`${task}-${label}-workspace.png`), animations: 'disabled' });
  }
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
});

test('все готовые примеры: каждый шаг, читаемость и снимки трёх задач', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const task of tasks) {
    await selectTask(page, task);
    const defaultMax = Number(await page.getByRole('slider', { name: 'Шаг алгоритма' }).getAttribute('max'));
    expect(defaultMax).toBeGreaterThanOrEqual(15);
    expect(defaultMax).toBeLessThanOrEqual(25);
    const fonts = await page.locator('.complexity strong, .complexity span, .tabs button, .section-heading h2').evaluateAll(elements => elements.map(element => ({
      size: parseFloat(getComputedStyle(element).fontSize), strong: element.tagName === 'STRONG',
    })));
    for (const font of fonts) {
      expect(font.size).toBeGreaterThanOrEqual(font.strong ? 18 : 13);
      expect(font.size).toBeLessThanOrEqual(font.strong ? 22 : 18);
    }
    for (const example of examples[task]) {
      await page.getByLabel('Пример дерева', {exact: true}).selectOption({label: example.name});
      await expect(page.getByRole('alert')).toHaveCount(0);
      await everyFrame(page);
      if (task !== 'traversal') {
        expect(presetResults[example.name]).not.toBeUndefined();
        await expect(page.locator('.result strong')).toHaveText(presetResults[example.name] ? 'True' : 'False');
      }
      if (task === 'balance' && example === examples.balance[0]) {
        await expect(page.locator('.height-math strong')).toHaveText(['3', '2', '1']);
      }
    }
    await page.getByLabel('Пример дерева', {exact: true}).selectOption({label: examples[task][0].name});
    await saveDefaultScreenshots(page, info, task);
  }
  expect(errors).toEqual([]);
});

test('шесть обходов возвращают точные последовательности, узлы доступны для изучения', async ({ page }) => {
  await applyInput(page, '[8,4,12,2,6,10,14]');
  await page.getByRole('button', { name: 'Узел 8', exact: true }).click();
  await expect(page.locator('.node-card dd')).toHaveText(['8', '4', '12']);
  const expected: Record<Order, number[]> = {
    preorder: [8, 4, 2, 6, 12, 10, 14],
    inorder: [2, 4, 6, 8, 10, 12, 14],
    postorder: [2, 6, 4, 10, 14, 12, 8],
    reverse_preorder: [8, 12, 14, 10, 4, 6, 2],
    reverse_inorder: [14, 12, 10, 8, 6, 4, 2],
    reverse_postorder: [14, 10, 12, 6, 2, 4, 8],
  };
  for (const [order, values] of Object.entries(expected)) {
    const reverse = order.startsWith('reverse_');
    await page.getByRole('button', {name: reverse ? 'Сначала правое' : 'Сначала левое', exact: true}).click();
    const kind = order.replace('reverse_', '');
    await page.getByRole('radio', {name: `${reverse ? 'Reverse ' : ''}${kind[0].toUpperCase()}${kind.slice(1)}`, exact: true}).click();
    await everyFrame(page);
    await lastStep(page);
    const result = await page.locator('.output-list > span').evaluateAll(elements => elements.map(element => Number(element.lastChild!.textContent)));
    expect(result).toEqual(values);
    await expect(page.getByRole('button', { name: 'Следующий шаг', exact: true })).toBeDisabled();
    await checkLayout(page);
  }
});

test('построение BST показывает вставки, сравнения, дубликаты и пустой вход', async ({ page }) => {
  await page.getByRole('button', { name: 'Построение BST', exact: true }).click();
  const defaultMax = Number(await page.getByRole('slider', { name: 'Шаг алгоритма' }).getAttribute('max'));
  expect(defaultMax).toBeGreaterThanOrEqual(15);
  expect(defaultMax).toBeLessThanOrEqual(25);
  await page.getByRole('button', { name: 'Следующий шаг', exact: true }).click();
  await expect(page.locator('.tree-node')).toHaveCount(1);
  await expect(page.locator('.step-explanation h3')).toContainText('корнем');
  await page.getByRole('button', { name: 'Следующий шаг', exact: true }).click();
  await expect(page.locator('.step-explanation h3')).toContainText('Сравниваем');
  await lastStep(page);
  await expect(page.locator('.tree-node')).toHaveCount(7);
  await expect(page.locator('.large-stat')).toContainText('7');
  const presetNames = await page.locator('#tree-example option').allTextContents();
  for (const name of presetNames) {
    await page.getByLabel('Пример дерева', {exact: true}).selectOption({label: name});
    await everyFrame(page);
  }
  await applyInput(page, '[8,4,12,4,10,8,14]');
  await lastStep(page);
  await expect(page.locator('.tree-node')).toHaveCount(5);
  await applyInput(page, '[]');
  await expect(page.locator('.empty-tree')).toBeVisible();
  await lastStep(page);
  await expect(page.locator('.large-stat')).toContainText('0');
});

test('объяснения, Python и тесты доступны для каждой задачи', async ({ page }) => {
  for (const task of tasks) {
    await selectTask(page, task);
    await page.getByRole('tab', { name: 'Объяснение', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Почему алгоритм работает' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Время и память' })).toBeVisible();
    await checkLayout(page);
    await page.getByRole('tab', { name: 'Python-код', exact: true }).click();
    await expect(page.locator('.source code')).toContainText('def ');
    await checkLayout(page);
    await page.getByRole('button', { name: 'Класс Node', exact: true }).click();
    await expect(page.locator('.source code')).toContainText('class Node');
    await page.getByRole('button', { name: 'Решение задачи', exact: true }).click();
    await page.getByRole('tab', { name: 'Тесты', exact: true }).click();
    await page.getByRole('button', { name: 'Проверить модель', exact: true }).click();
    await expect(page.locator('.check-results .pass')).toHaveCount(3);
    await expect(page.locator('.check-results .fail')).toHaveCount(0);
    await page.getByText('Исходный код Python-тестов', { exact: true }).click();
    await expect(page.locator('.source code')).toContainText('unittest');
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Скачать тесты', exact: true }).click();
    expect((await downloaded).suggestedFilename()).toBe('test_algorithms.py');
    await checkLayout(page);
  }
});

test('воспроизведение, пауза, перемотка и границы масштаба', async ({ page }) => {
  const slider = page.getByRole('slider', { name: 'Шаг алгоритма' });
  await page.getByRole('combobox', { name: 'Скорость', exact: true }).selectOption('2');
  await page.getByRole('button', { name: 'Запустить', exact: true }).click();
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  const paused = await slider.inputValue();
  await page.waitForTimeout(900);
  await expect(slider).toHaveValue(paused);
  await page.getByRole('button', { name: 'В начало', exact: true }).click();
  await expect(slider).toHaveValue('0');
  await expect(page.getByRole('button', { name: 'Предыдущий шаг', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Следующий шаг', exact: true }).click();
  await expect(slider).toHaveValue('1');
  await page.getByRole('button', { name: 'Предыдущий шаг', exact: true }).click();
  await expect(slider).toHaveValue('0');
  for (let count = 0; count < 5; count++) await page.getByRole('button', { name: 'Увеличить дерево', exact: true }).click();
  await expect(page.locator('.zoom-controls > span')).toHaveText('150%');
  await expect(page.getByRole('button', { name: 'Увеличить дерево', exact: true })).toBeDisabled();
  await checkLayout(page);
  for (let count = 0; count < 8; count++) await page.getByRole('button', { name: 'Уменьшить дерево', exact: true }).click();
  await expect(page.locator('.zoom-controls > span')).toHaveText('75%');
  await expect(page.getByRole('button', { name: 'Уменьшить дерево', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Вписать дерево', exact: true }).click();
  const fitted = Number((await page.locator('.zoom-controls > span').innerText()).replace('%', ''));
  expect(fitted).toBeGreaterThanOrEqual(75);
  expect(fitted).toBeLessThanOrEqual(100);
  await checkLayout(page);
});

test('ошибочный ввод не заменяет последний корректный пример', async ({ page }) => {
  const invalid = ['[8,', '{}', '[8, null]', '[1.5]', '[true]', '[9007199254740992]', JSON.stringify(Array.from({ length: 16 }, (_, index) => index))];
  for (const input of invalid) {
    await applyInput(page, input);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.locator('.tree-node')).toHaveCount(15);
    await checkLayout(page);
  }
  for (const task of ['validate', 'balance'] as const) {
    await selectTask(page, task);
    for (const input of ['[null, 2]', '[8, null, null, 4]', '["8"]', JSON.stringify(Array(32).fill(null))]) {
      await applyInput(page, input);
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.locator('.tree-node')).toHaveCount(9);
      await checkLayout(page);
    }
    await applyInput(page, '[]');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await lastStep(page);
    await expect(page.locator('.result strong')).toHaveText('True');
  }
});

test('15 узлов, длинные значения и глубокие деревья остаются внутри схемы', async ({ page }) => {
  const wide = [0, -500000, 500000, -750000, -250000, 250000, 750000, -1000000, -600000, -400000, -100000, 100000, 400000, 600000, 1000000];
  const extremes = [0, -9007199254740991, 9007199254740991];
  for (const task of tasks) {
    await selectTask(page, task);
    for (const values of [wide, extremes]) {
      await applyInput(page, JSON.stringify(values));
      await expect(page.getByRole('alert')).toHaveCount(0);
      await everyFrame(page);
    }
    const chain = task === 'traversal' ? Array.from({ length: 15 }, (_, index) => index - 7) : Array.from({ length: 15 }, (_, index) => index === 0 ? [index - 7] : [null, index - 7]).flat();
    await applyInput(page, JSON.stringify(chain));
    await expect(page.getByRole('alert')).toHaveCount(0);
    await everyFrame(page);
    expect(await page.locator('.tree-viewport').evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  }
});

test('карточки обходов доступны с клавиатуры; анимации плавные и учитывают reduced motion', async ({ page }) => {
  const inorder = page.getByRole('radio', {name: 'Inorder', exact: true});
  await inorder.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', {name: 'Postorder', exact: true})).toBeChecked();
  await page.keyboard.press('Home');
  await expect(page.getByRole('radio', {name: 'Preorder', exact: true})).toBeFocused();
  await page.getByRole('button', {name: 'Сначала правое', exact: true}).click();
  await expect(page.getByRole('radio', {name: 'Reverse Preorder', exact: true})).toBeChecked();
  await page.getByRole('button', {name: 'Сначала левое', exact: true}).click();
  await inorder.click();
  await page.emulateMedia({reducedMotion: 'no-preference'});
  const geometry = await page.locator('.tree-edge').evaluateAll(paths => paths.map(path => {
    path.setAttribute('data-continuity', 'kept');
    return path.getAttribute('d');
  }));
  await page.getByRole('button', {name: 'Следующий шаг', exact: true}).click();
  await expect(page.locator('.tree-edge')).toHaveCount(14);
  await expect(page.locator('.tree-edge.on-route')).toHaveCount(3);
  await expect(page.locator('.tree-edge[data-continuity=kept]')).toHaveCount(14);
  expect(await page.locator('.tree-edge').evaluateAll(paths => paths.map(path => path.getAttribute('d')))).toEqual(geometry);
  await expect(page.locator('.tree-svg marker, .route-overlay')).toHaveCount(0);
  await expect(page.locator('.route-traveler, animateMotion, .tree-svg circle')).toHaveCount(0);
  expect(await page.locator('.tree-edge').first().evaluate(path => getComputedStyle(path).transitionDuration)).toBe('0.7s');
  // The destination stays neutral until the wave arrives.
  await expect(page.locator('.tree-node.pending')).toHaveCount(1);
  await expect(page.locator('.tree-node.active')).toHaveCount(0);
  await expect.poll(() => page.locator('.tree-edge.on-route').evaluateAll(paths => paths.some(path => parseFloat(getComputedStyle(path).strokeWidth) > 3.5))).toBe(true);
  // Observe the feathered gradient changing, then settling back to an opaque base.
  await expect.poll(() => page.locator('.edge-wave').evaluateAll(stops => stops.some(stop => stop.getAttribute('stop-color') !== '#bdcdb4'))).toBe(true);
  await expect.poll(() => page.locator('.edge-wave').evaluateAll(stops => stops.every(stop => stop.getAttribute('stop-color') === '#bdcdb4'))).toBe(true);
  expect(await page.locator('.edge-wave').evaluateAll(stops => stops.every(stop => getComputedStyle(stop).stopOpacity === '1'))).toBe(true);
  await expect(page.locator('.tree-node.pending')).toHaveCount(0);
  await checkLayout(page);
  await expect(page.locator('.output-list > span.latest')).toHaveCount(1);
  await expect(page.locator('.tree-node.active .focus-tick')).toHaveCSS('opacity', '1');
  await expect(page.locator('.tree-node.active > rect')).toHaveCSS('fill', 'rgb(255, 240, 207)');
  await page.getByRole('combobox', {name: 'Скорость', exact: true}).selectOption('2');
  await page.getByRole('button', {name: 'Следующий шаг', exact: true}).click();
  expect(await page.locator('.tree-edge').first().evaluate(path => getComputedStyle(path).transitionDuration)).toBe('0.35s');
  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect.poll(() => page.locator('.edge-wave').evaluateAll(stops => stops.every(stop => stop.getAttribute('stop-color') === '#bdcdb4'))).toBe(true);
  expect(await page.locator('.tree-edge').first().evaluate(path => getComputedStyle(path).transitionDuration)).toBe('0s');
  await page.setViewportSize({width: 1440, height: 1000});
  await page.getByRole('slider', {name: 'Шаг алгоритма'}).fill('8');
  await page.setViewportSize({width: 390, height: 844});
  await expect.poll(() => page.evaluate(() => {
    const area = document.querySelector('.tree-viewport')!.getBoundingClientRect();
    const node = document.querySelector('.tree-node.active > rect')!.getBoundingClientRect();
    return node.left >= area.left && node.right <= area.right;
  })).toBe(true);
  await checkLayout(page);
});
