import {test, expect} from '@playwright/test';

test('ввод, шаги, результат, перемотка, ошибки', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', {name: 'Two sum'})).toBeVisible();
  await page.getByRole('button', {name: 'Из условия', exact: true}).click();
  await page.getByLabel('Шаг алгоритма', {exact: true}).fill('6');
  await expect(page.locator('.result')).toContainText('1 2');
  await page.getByRole('button', {name: 'Предыдущий шаг'}).click();
  await expect(page.locator('.result')).toHaveCount(0);
  await page.getByRole('button', {name: 'Повторы', exact: true}).click();
  await page.getByRole('button', {name: 'Следующий шаг'}).click();
  await expect(page.locator('.step-info')).toContainText('Ищем 5');
  await page.getByLabel('Массив arr').fill('[5]');
  await page.getByRole('button', {name: 'Применить'}).click();
  await page.getByLabel('Шаг алгоритма', {exact: true}).fill('3');
  await expect(page.locator('.result')).toContainText('ValueError');
  await page.getByLabel('Массив arr').fill('[true]');
  await page.getByRole('button', {name: 'Применить'}).click();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(errors).toEqual([]);
});

test('все задачи, вкладки и границы экрана', async ({page}, testInfo) => {
  await page.goto('/');
  for (const task of ['Two sum', 'Anagrams', 'Хеш-таблица']) {
    await page.getByRole('button', {name: new RegExp(task)}).click();
    for (const tab of ['Визуализация', 'Как это работает', 'Python-код', 'Тесты']) {
      await page.getByRole('tab', {name: tab, exact: true}).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await page.getByRole('button', {name: 'Проверить модель'}).click();
    await expect(page.locator('.check-results > div')).toHaveCount(4);
    await expect(page.locator('.check-results')).not.toContainText('✕');
    await page.getByRole('tab', {name: 'Визуализация', exact: true}).click();
    const slider = page.getByLabel('Шаг алгоритма', {exact: true});
    await slider.fill((await slider.getAttribute('max'))!);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(350); // Дождаться затухания Motion перед визуальным снимком.
    await page.screenshot({path: testInfo.outputPath(`${task.replaceAll(' ', '-')}.png`), fullPage: true});
  }
});

test('автопроигрывание, пауза, смена задачи', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name: 'Запустить', exact: true}).click();
  await expect(page.getByLabel('Шаг алгоритма', {exact: true})).not.toHaveValue('0');
  await page.getByRole('button', {name: 'Пауза', exact: true}).click();
  await page.getByRole('button', {name: /Anagrams/}).click();
  await expect(page.getByLabel('Шаг алгоритма', {exact: true})).toHaveValue('0');
  await page.getByLabel('Список слов strs').fill('["' + 'я'.repeat(32) + '","🙂"]');
  await page.getByRole('button', {name: 'Применить'}).click();
  await page.getByLabel('Шаг алгоритма', {exact: true}).fill('5');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
